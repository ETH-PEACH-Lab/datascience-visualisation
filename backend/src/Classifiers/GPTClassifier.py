from openai import OpenAI, BadRequestError
from typing import List
import re

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
    
    def update_prompt(self, prompt: str):
        self.messages = [
            {
                "role": "system", 
                "content": prompt
            },
        ]
    
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
            
    
    def predict(self, X: List[str], verbose: bool = False) -> List[str]:
        """
        Predicts the labels for the given list of code snippets.

        Args:
            X (List[str]): A list of code snippets to predict labels for.
            verbose (bool): Whether to print verbose output.

        Returns:
            List[str]: A list of predicted labels for each code snippet.
        """
        if verbose: print("Predicting labels for code snippets...")
        predictions = []
        try:
            for i, code in enumerate(X):
                if verbose: print(f"Predicting code snippet {i+1}/{len(X)}", end="\r")
                messages = self.messages.copy()
                messages.append({
                    "role": "user",
                    "content": code
                })
                prediction = None
                try:
                    while not prediction:
                        chat_completion = self.client.chat.completions.create(
                            messages=messages,
                            model="gpt-3.5-turbo"
                        )          
                        response = chat_completion.choices[0].message.content
                        found_label = False
                        for label in self.labels:
                            if label in response:
                                prediction = label
                                found_label = True
                                break
                        if verbose and not found_label: print(f"[ERROR] {i+1}/{len(X)}: Response string invalid:\n{response}\n\nRetrying...", end="\r")
                except BadRequestError as e:
                    print(f"[ERROR] GPTClassifier prediction:\n{e}\n")
                    print(f"Assigning label 'Invalid' to the following code snippet:\n{code}\n")
                    prediction = "Invalid"
                finally:
                    predictions.append(prediction) 
            
            if verbose: print("Prediction complete.")
        except Exception as e:
            print(f"[ERROR] GPTClassifier prediction:\n{e} \n\n")
            
            print(f"Returning {len(predictions)}/{len(X)} predictions")
        finally:
            return predictions
        
        
    def classify_notebook(self, notebook: List[str], verbose: bool = False) -> List[str]:
        """
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
            try:
                while not prediction:
                    chat_completion = self.client.chat.completions.create(
                        messages=messages,
                        model="gpt-4o"
                    )          
                    response = chat_completion.choices[0].message.content
                    found_label = False
                    for label in self.labels:
                        if label in response:
                            prediction = label
                            found_label = True
                            break
                    if verbose and not found_label: print(f"[ERROR] {i+1}/{len(notebook)}: Response string invalid:\n{response}\n\nRetrying...", end="\r")
                    #TODO: add constraint in prompt to assign same class as previous or next code_cell if unable to classify clearly (for instance code cell with only variable assignments)
            except BadRequestError as e:
                print(f"[ERROR] GPTClassifier prediction:\n{e}\n")
                print(f"Assigning label 'Invalid' to the following code snippet:\n{code_cell}\n")
                prediction = "Invalid"
            finally:
                classes.append(prediction)
        print(f"Number of messages in chat: {len(messages)}")
        return classes
    
    
    def clean_code(self, code):
        def remove_docstring(code: str) -> str:
            # Regular expression to match function definitions with docstrings
            pattern = re.compile(
                r'(def\s+\w+\s*\([^)]*\)\s*:\s*)'  # Match the function definition
                r'(\s*"""(?:[^"]|"(?!")|""(?!"))*"""|'  # Match triple double-quoted strings
                r'\s*\'\'\'(?:[^\']|\'(?!\')|\'\'(?!\'))*\'\'\')'  # Match triple single-quoted strings
            , re.DOTALL)

            def replace_func(match):
                # Return the function definition part without the docstring
                return match.group(1)

            # Replace the function definitions with docstrings with just the function definitions
            cleaned_code = re.sub(pattern, replace_func, code)
            
            return cleaned_code

        def remove_comments(code: str) -> str:
            comment_pattern = r'#.*'  # Matches any text starting with '#'
            cleaned_code = re.sub(comment_pattern, '', code)
            return cleaned_code
        
        code = remove_docstring(code)
        code = remove_comments(code)
        return code
        
