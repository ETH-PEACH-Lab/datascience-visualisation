import json
import itertools
from tqdm import tqdm
from sklearn.cluster import HDBSCAN
import sys; sys.path.insert(0, '../')
from utils.helper_functions import clean_code
from Clusterers.title_generator import TitleGenerator
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
from sklearn.metrics import confusion_matrix    
from scipy.optimize import linear_sum_assignment
from sklearn.manifold import TSNE
from sklearn.metrics import silhouette_score
from sklearn.metrics import calinski_harabasz_score
from sklearn.metrics import davies_bouldin_score



class ClassCluster():
    
    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        self._model = AutoModel.from_pretrained("microsoft/codebert-base")
        self._model.to(self.device)
        self.clusterer = HDBSCAN(
            min_cluster_size=10,
            min_samples=2,
            cluster_selection_epsilon=.0,
            max_cluster_size=None,
            alpha=1.0
        )
        self.title_generator = TitleGenerator()
        
    def embed_cell(self, code_str: str, desc_str: str) -> list[float]:
        """
        Embeds a code snippet and its description into a vector representation.
        Args:
            code_str (str): The code snippet to be embedded.
            desc_str (str): The description of the code snippet.
        Returns:
            list[float]: A list representing the embedded vector of the code snippet and its description.
        """
        
        code_embedding = self._process_code(code_str)
        desc_embedding = self._process_summary(desc_str)
        return torch.mean(torch.stack([code_embedding, desc_embedding]), dim=0).detach().numpy().reshape(-1).tolist()
        
    
    def cluster(self, data: dict, classes: list[str]) -> dict:
        """
        Clusters code cells in the given data dictionary based on their class.
        Args:
            data (dict): A dictionary containing code cells.
        Returns:
            dict: A dictionary with clustered code cells.
        """
        
        cells = []
        for notebook_idx, notebook in enumerate(data["notebooks"]):
            cells += [{**cell, "index": cell_idx, "notebook_idx": notebook_idx} for cell_idx, cell in enumerate(notebook["cells"])]
        
        # Generate embeddings for each code cell
        for cell in tqdm(cells, desc="Embedding code cells and their descriptions"):
            cell["embedding"] = self.embed_cell(clean_code(cell["code"]), cell["desc"])
        
        # Group cells by class
        grouped_cells = {label: [] for label in classes}
        for cell in cells:
            grouped_cells[cell["class"]].append(cell)
        # grouped_cells = {k: list(v) for k, v in itertools.groupby(cells, lambda x: x["class"])}
        
        # Cluster the cells for each class
        clusters = {}
        descriptions_per_cluster = {}
        for class_name, class_cells in grouped_cells.items(): 
            print(f"Class {class_name}: {len(class_cells)} cells")
            
            labels = []
            if len(class_cells) < 10:
                labels = [-1] * len(class_cells)
            else:
                labels = self.cluster_class(class_cells)
            embeddings = [cell["embedding"] for cell in class_cells]
            descs = [cell["desc"] for cell in class_cells]
            sil_score, ch_index, db_index = self._evaluate_clustering_accuracy(embeddings, labels)
            
            clusters[class_name] = {str(i): "" for i in set(labels)}
        
            for i, cell in enumerate(class_cells):
                notebook_idx = cell["notebook_idx"]
                cell_idx = cell["index"]
                data["notebooks"][notebook_idx]["cells"][cell_idx]["cluster"] = int(labels[i])
            
            descriptions_per_cluster[class_name] = {
                "titles": self.title_generator.generate_titles_from_descs(labels, descs),
                "accuracy": {
                    "silhouette_score": sil_score,
                    "ch_index": ch_index,
                    "db_index": db_index
                }
            }
                    
        data["metadata"]["clusters"] = descriptions_per_cluster
        return data
        
    def cluster_class(self, cells: list[dict]) -> list[int]:
        """
        Clusters the given embeddingss.
        Args:
            embeddings (list[list[float]]): A list of embeddings to be clustered.
        Returns:
            list[int]: A list of cluster labels.
        """
        
        embeddings = np.array([cell["embedding"] for cell in cells])
        
        # Dimension reduction
        tsne = TSNE(n_components=2, perplexity=30, max_iter=3000)
        reduced_embeddings = tsne.fit_transform(embeddings)
        
        # Clustering all reduced embeddings
        self.clusterer.fit(reduced_embeddings)
        labels = self.clusterer.labels_
        
        # Reclustering outliers only
        outlier_idx = np.where(labels == -1)[0]
        outliers = reduced_embeddings[outlier_idx]
        self.clusterer.fit(outliers)
        outlier_labels = self.clusterer.labels_
        
        # Relabel clustererd outliers
        max_cluster = max(labels)+1
        for i, idx in enumerate(outlier_idx):
            if outlier_labels[i] != -1:
                labels[idx] = max_cluster + outlier_labels[i]
        
        return labels
    
    
    ##############################################
    ########### Private/Helper methods ###########
    ##############################################
    
    def _evaluate_clustering_accuracy(self, embeddings: list[list[float]], labels: list[int]) -> float:
        sil_score = 0
        ch_index = 0
        db_index = 0
        try:
            sil_score = silhouette_score(embeddings, labels)
            ch_index = calinski_harabasz_score(embeddings, labels)
            db_index = davies_bouldin_score(embeddings, labels)

        except Exception as e:
            print("[EVALUATION ERROR]", e.with_traceback())
            sil_score = 0
            ch_index = 0
            db_index = 0
        finally:
            return sil_score, ch_index, db_index
        
        
    def _process_code(self, code_str, max_length=512, stride=256) -> torch.Tensor:
        """
        Process the given code string by tokenizing it with chunking for long code strings.
        Args:
            code_str (str): The code string to be processed.
            max_length (int, optional): The maximum length of each chunk. Defaults to 512.
            stride (int, optional): The stride between each chunk. Defaults to 256.
        Returns:
            torch.Tensor: The final output tensor after processing the code string.
        """
        
        # Tokenization with chunking for long code strings
        tokens = self._tokenizer(code_str, return_tensors='pt', max_length=max_length, stride=stride, truncation=True).to(self.device)
        
        outputs = []
        for i in range(0, tokens.input_ids.size(1), stride):
            chunk = tokens.input_ids[:, i:i + max_length]
            attention_mask_chunk = tokens.attention_mask[:, i:i + max_length]
            output_chunk = self._model(chunk, attention_mask=attention_mask_chunk)[0]
            outputs.append(torch.mean(output_chunk, dim=1))  # Average over the sequence length
        
        # Average across all chunks
        final_output = torch.mean(torch.stack(outputs), dim=0)
        return final_output 
    
    def _process_summary(self, summary_str) -> torch.Tensor:
        """
        Process the summary string by tokenizing it and passing it through the model.
        Args:
            summary_str (str): The summary string to be processed.
        Returns:
            torch.Tensor: The processed summary output.
        """
        
        # Tokenization without chunking for short summary strings
        tokens = self._tokenizer(summary_str, return_tensors='pt', truncation=True, max_length=512).to(self.device)
        
        # Directly pass through the model
        outputs = self._model(**tokens)
        summary_output = torch.mean(outputs.last_hidden_state, dim=1)  # Average over the sequence length
        return summary_output
    
def evaluate_clustering(true_labels: np.ndarray, predicted_labels: np.ndarray) -> float:
        
        assert len(true_labels) == len(predicted_labels)
        
        unique_true_labels = np.unique(true_labels)
        unique_predicted_labels = np.unique(predicted_labels)
        
        cost_matrix = np.zeros((len(unique_true_labels), len(unique_predicted_labels)), dtype=int)
        
        for i, true_label in enumerate(unique_true_labels):
            for j, predicted_label in enumerate(unique_predicted_labels):
                cost_matrix[i, j] = np.sum((true_labels == true_label) & (predicted_labels != predicted_label))
        
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        
        misclustered_count = cost_matrix[row_ind, col_ind].sum()
        
        return 1-(misclustered_count/len(true_labels))
    
    
def hungarian_clustering_accuracy(true_labels, predicted_labels):
        # Create a confusion matrix
        cm = confusion_matrix(true_labels, predicted_labels)
        
        # Use the Hungarian algorithm to find the optimal assignment
        row_indices, col_indices = linear_sum_assignment(-cm)
        
        # Calculate the accuracy based on the optimal assignment
        accuracy = cm[row_indices, col_indices].sum() / len(true_labels)
        
        return accuracy