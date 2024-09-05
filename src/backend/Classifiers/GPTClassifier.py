from openai import OpenAI, BadRequestError
from typing import List
import re
from chromadb.utils import embedding_functions
import tqdm
from utils.helper_functions import clean_code
import multiprocessing


class GPTClassifier():
    """
    A classifier that uses the GPT model for text classification.

    Args:
        Classifier (type): The base classifier class.

    Attributes:
        client (OpenAI): The OpenAI client used for API communication.
        labels (List[str]): A list of labels used for classification.
        messages (List[dict]): A list of messages exchanged between the user and the assistant.
    """
    
    def __init__(self, api_key: str, prompt: str, labels: List[str]):
        """
        Initializes a GPTClassifier object.

        Args:
            api_key (str): The API key used for authentication with the OpenAI service.
            prompt (str): The initial prompt for the GPT model.
            labels (List[str]): A list of labels used for classification.
        """
        self.client = OpenAI(api_key=api_key)
        self.labels = labels
        self.messages = [
            {
                "role": "system", 
                "content": prompt
            },
        ]
        self.embedder = embedding_functions.OpenAIEmbeddingFunction(
            api_key=api_key,
            model_name="text-embedding-ada-002"
        )
    
    def train(self, X: List[str], y: List[str]) -> True:
        """
        Trains the GPTClassifier model using the provided input data.

        Args:
            X (List[str]): The list of input code snippets.
            y (List[str]): The list of corresponding labels for the code snippets.

        Returns:
            bool: True if the training is successful.

        Raises:
            ValueError: If the lengths of X and y are not equal.
        """
        if len(X) != len(y):
            raise ValueError("X and y must have the same length")
        
        for code, label in zip(X, y):
            self.messages += [
                {
                    "role": "user",
                    "content": code
                }, 
                {
                    "role": "assistant",
                    "content": label,
                }
            ]
        return True
        
    def classify_notebook(self, notebook: List[str], verbose: bool = False) -> List[tuple[str, str]]:
        """
        DEPRECATED !
        Classifies the code cells in a Jupyter notebook.

        Args:
            notebook (List[str]): A list of code cells to classify.
            verbose (bool): Whether to print verbose output.

        Returns:
            List[str]: A list of predicted labels for each code cell.
        """
        if verbose: print(f"Classifying {len(notebook)} code cells...")
        messages = self.messages.copy()
        classes = []
        for i, code_cell in enumerate(notebook):
            messages.append({
                "role": "user",
                "content": code_cell
            })
            
            prediction = None
            description = None
            try:
                while not prediction:      
                    prediction, description = self._make_prediction(messages, verbose=verbose)
                    if verbose: print(f"Predicted label {i+1}/{len(notebook)}: {prediction}")
                    # TODO: add response to message history
            except BadRequestError as e:
                print(f"[ERROR] GPTClassifier prediction:\n{e}\n")
                print(f"Assigning label 'Invalid' to the following code snippet:\n{code_cell}\n")
                prediction = "Invalid"
                description = "An error occurred while classifying this code snippet."
            finally:
                classes.append((prediction, self.embedder([description])[0]))
        print(f"Number of messages in chat: {len(messages)}")
        return classes
    
    def classify_ipynb(self, notebook: dict, embed: bool = True, verbose: bool = False) -> list[dict]:
        # Copy clear message history
        messages = self.messages.copy()
                
        cells = [cell for cell in notebook["cells"] if cell["cell_type"] == "code" and len(cell["source"])]
        classified_cells = []
        i = 0
        for cell in tqdm.tqdm(cells):
            if isinstance(cell["source"], list): cell["source"] = "\n".join(cell["source"])
            if cell["cell_type"] == "code" and len(cell["source"]):
                messages.append({"role": "user","content": cell["source"]})
                prediction, description = self._make_prediction(messages, verbose=verbose)
                messages.append({
                    "role": "assistant", 
                    "content": f"Class: {prediction}\nDescription: {description}"
                })
                
                new_cell = {
                    "cell_id": i,
                    "code": cell["source"],
                    "output": "\n".join(cell["outputs"]),
                    "class": prediction,
                    "desc": description,
                }
                if embed: new_cell["embedding"] = self.embedder([description])[0]
                if "class" in cell["metadata"] and "subclass" in cell["metadata"] and "subclass_id" in cell["metadata"]:
                    new_cell["testing"] = {
                        "class": cell["metadata"]["class"],
                        "subclass": cell["metadata"]["subclass"],
                        "subclass_id": cell["metadata"]["subclass_id"],
                        "predicted_subclass_probability": cell["metadata"]["predicted_subclass_probability"]
                    }
                classified_cells.append(new_cell)

                i += 1
            elif cell["cell_type"] == "markdown" and len(cell["source"]):
                messages.append({
                    "role": "user",
                    "content": self._markdown_prompt(cell["source"])
                })

        return classified_cells 
            

    def evaluate(self, notebook: dict, verbose: bool = False):
        messages = self.messages.copy()
        cells = [cell for cell in notebook["cells"] if cell["cell_type"] == "code"]
        misclassification_dict = {label: {"count": 0, "misclassified": 0} for label in self.labels}
        correct_count = 0
        cell_count = 1
        
        truths = []
        preds = []
        for cell in tqdm.tqdm(cells, desc=f"Evaluating"):
            if not isinstance(cell["source"], str): print(cell["source"])
            if cell["cell_type"] == "code" and len(cell["source"]): 
                messages.append({"role": "user", "content": cell["source"]})
                prediction, description = self._make_prediction(messages, verbose=verbose)
                messages.append({
                    "role": "assistant", 
                    "content": f"Class: {prediction}\nDescription: {description}"
                })
            
                if verbose: print(f"Predicted label {cell_count}/{len(cells)}: {prediction}")
                
                true_class = cell["metadata"]["class"]
                if true_class == "EDA": true_class = "Exploratory_Data_Analysis"
                
                truths.append(true_class)
                preds.append(prediction)
                
                if prediction == true_class: correct_count += 1
                else: misclassification_dict[true_class]["misclassified"] += 1
                
                misclassification_dict[true_class]["count"] += 1
                cell_count += 1
                
            elif cell["cell_type"] == "markdown" and len(cell["source"]):
                messages.append({
                    "role": "user",
                    "content": self._markdown_prompt(cell["source"])
                })
            
        accuracy = correct_count / len(cells) * 100
        if verbose: print(f"Accuracy: {accuracy:.2f}%")
        return accuracy, misclassification_dict, truths, preds
                
            
    
    
    ##############################
    ###### Private methods #######
    ##############################
    
    
    def _make_prediction(self, messages: List[dict], verbose: bool = False) -> str:
        """
        Makes a prediction based on the provided messages.

        Args:
            messages (List[dict]): A list of messages exchanged between the user and the assistant.

        Returns:
            str: The predicted label.
        """
    
        prediction = None
        description = None
        while not prediction:   
            # TODO: add timeout mechanism 
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="gpt-4o"
            )
            response = chat_completion.choices[0].message.content
            
            found_label = False
            match = re.search(r"Class: (.+)\nDescription: (.+)", response)
            
            if match:
                class_label = match.group(1)
                if class_label in self.labels:
                    prediction = class_label
                    found_label = True
                    description = match.group(2)

            if verbose and not found_label: print(f"[ERROR] Response string invalid:\n{response}\n\nRetrying...", end="\r") 
            
        return prediction, description
    
    
    def _markdown_prompt(markdown_text: str) -> str:
        """
        Formats a markdown prompt for the GPT model.

        Args:
            markdown_text (str): The markdown text to format.

        Returns:
            str: The formatted markdown prompt.
        """
        return f"""Now, the upcoming code cells are related to this markdown-cell text:\n{markdown_text}"""