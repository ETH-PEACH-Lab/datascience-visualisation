import json
import re
from typing import List, Dict
import os
import kaggle
import random
from client import FirebaseClient

def notebook_extract_code(notebook_json: dict) -> str:
    """
    Parse an .ipynb file and return the code cells as a string.

    Args:
    file_path (str): The path to the .ipynb file.

    Returns:
    str: The code cells in the .ipynb file as a string.
    """
    # json_data = _ipynb_to_json(file_content)
    code_cells = []
    for cell in notebook_json['cells']:
        if cell['cell_type'] == 'code' and len(cell['source']):
            code_cells.append(clean_code(cell['source']))
    return code_cells


def notebook_add_class_labels(notebook_json: dict, class_labels: List[str]) -> json:
    # notebook_json = _ipynb_to_json(file_content)
    labels = []
    counter= 0
    for i in range(len(notebook_json['cells'])):
        cell = notebook_json['cells'][i]
        if cell['cell_type'] == 'code' and len(cell['source']):
            notebook_json['cells'][i]['metadata']['class'] = class_labels[counter]
            notebook_json['cells'][i]['metadata']['cell_id'] = counter
            notebook_json['cells'][i]['metadata']['start_cell'] = class_labels[counter] not in labels
            if class_labels[counter] not in labels: labels.append(class_labels[counter])
                
            counter += 1
    return notebook_json


def clean_code(code):
    """Cleans the given code by removing docstrings and comments.

    Args:
        code (str): The code to be cleaned.

    Returns:
        str: The cleaned code.
    """
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
    return code.strip()


def kaggle_pull_competiton(competition_name: str, path: str, n_notebooks: int = 20, verbose: bool = False) -> List[dict]:
    """Download notebooks from a Kaggle competition.

    Args:
        competition_name (str): The name of the Kaggle competition.
        path (str): The path to the folder where the notebooks will be downloaded. It is recommended to use a temporary folder.
        n_notebooks (int, optional): The number of notebooks to download. Defaults to 20.
        verbose (bool, optional): Whether to display verbose output. Defaults to False.

    Returns:
        List[dict]: A list of dictionaries representing the downloaded notebooks.
    """
    if verbose: print("Validating Kaggle api key")
    os.environ['KAGGLE_CONFIG_DIR'] = os.path.expanduser('~/.kaggle')
    
    if verbose: print("Get the list of kernels (notebooks)")
    kernels = kaggle.api.kernels_list(
        competition=competition_name,
        page_size=n_notebooks
    )
    
    # Extract the kernel references to be able to pull them from kaggle
    if verbose: print(f"Extracting kernel references from {len(kernels)} kernels")
    kernel_refs = [vars(kernel)["ref"] for kernel in kernels]
    
    notebooks = []
    for i, kernel_ref in enumerate(kernel_refs):
        # Pull each notebook using its reference
        if verbose: print(f"Pulling notebook {kernel_ref} ({i+1}/{len(kernel_refs)})", end="\r")
        kaggle.api.kernels_pull(kernel_ref, path=path, metadata=False)
        notebook_path = f"{path}/{kernel_ref.split('/')[-1]}.ipynb"
        
        with open(notebook_path, 'r') as file:
            notebook = json.load(file)
            notebooks.append(notebook)
    return notebooks
    

def ipynb_to_json(file_content: bytes) -> json:
    """Converts the content of an IPython notebook file to JSON format.

    Args:
        file_content (bytes): The content of the IPython notebook file as bytes.

    Returns:
        json: The JSON representation of the IPython notebook.
    """
    json_string = file_content.decode("utf-8")
    return json.loads(json_string)

def generate_output_name(client: FirebaseClient) -> str:
    output_name = f'output_{random.randint(100000, 999999)}'
    while client.notebook_exists(output_name): 
        output_name = f'output_{random.randint(100000, 999999)}'
    return output_name




if __name__ == "__main__":
    import sys
    sys.path.append('../')
    from Classifiers.GPTClassifier import GPTClassifier

    with open('../../api_key.txt', 'r') as f: api_key = f'{f.read()}'
    LABELS = [
        "Data_Transform",
        "Data_Extraction",
        "Visualization",
        "Hyperparam_Tuning",
        "Model_Interpretation",
        "Model_Train",
        "Debug"
    ]
    prompt = f"""Classify the code into {', '.join(LABELS[:-1])} or {LABELS[-2]}.
    Desired format:
    Class: <class_label>""" #TODO
    
    file_path = "/home/ryounis/Documents/Zurich/PEACHLab/backend/data/test.ipynb"
    with open(file_path, "rb") as file:
        file_content = file.read()
    notebook_json = _ipynb_to_json(file_content)
    
    # Classify
    notebook_code = ipynb_extract_code(file_content)
    
    classifier = GPTClassifier(api_key=api_key, prompt=prompt, labels=LABELS)
    cell_labels = classifier.classify_notebook(notebook_code)
    
    notebook_json = ipynb_add_class_labels(file_content, cell_labels)
    print(notebook_json)
    
    