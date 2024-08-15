import torch
from transformers import AutoTokenizer, AutoModel
from sklearn.cluster import HDBSCAN
from typing import List
import pandas as pd
from sklearn.metrics import confusion_matrix    
from scipy.optimize import linear_sum_assignment
import numpy as np

class Clusterer():
    
    def __init__(self) -> None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        self._model = AutoModel.from_pretrained("microsoft/codebert-base")
        self._model.to(device)
        
        self.clusterer: HDBSCAN = HDBSCAN()
        
        
    def embed(self, code: str, summary: str = None) -> torch.Tensor:
        """
        Embeddes the given code and summary (if provided).

        Args:
            code (str): The code to be embedded.
            summary (str, optional): An NL-summary of the code for better embedding. Defaults to None.

        Returns:
            torch.Tensor: The tokenized code and summary (if provided) embeddings.
        """
        code_tokens = self._tokenizer.tokenize(code)
        tokens = []
        if summary:
            nl_tokens = self._tokenizer.tokenize(summary)
            tokens = [self._tokenizer.cls_token] + nl_tokens + [self._tokenizer.sep_token]
        tokens += code_tokens + [self._tokenizer.eos_token]
        tokens_ids = self._tokenizer.convert_tokens_to_ids(tokens)
        context_embeddings = self._model(torch.tensor(tokens_ids)[None,:])[0]
        return context_embeddings
    
    def cluster(self, codes: List[str]) -> List[int]:
        
        embedded_code = [self.embed(code) for code in codes]
        self.clusterer.fit(embedded_code)
        return self.clusterer.labels_
    
    
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
        
        return misclustered_count/len(true_labels)
        
    def hungarian_clustering_accuracy(true_labels, predicted_labels):
        # Create a confusion matrix
        cm = confusion_matrix(true_labels, predicted_labels)
        
        # Use the Hungarian algorithm to find the optimal assignment
        row_indices, col_indices = linear_sum_assignment(-cm)
        
        # Calculate the accuracy based on the optimal assignment
        accuracy = cm[row_indices, col_indices].sum() / len(true_labels)
        
        return accuracy