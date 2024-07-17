import sys
from Classifiers.GPTClassifier import GPTClassifier
from utils.helper_functions import ipynb_to_json, notebook_extract_code, notebook_add_class_labels, kaggle_pull_competiton, generate_output_name
from utils.constants import FIRST_LAYER_LABELS, SECOND_LAYER_LABELS, BLANK_IPYNB_JSON
from client import FirebaseClient
import json
import tempfile
import random
import os

OUTPUT_DIR = "."

def classify_local(dir_path: str, classifier: GPTClassifier, client: FirebaseClient):
    """Classify the code cells of a local notebook.

    Args:
        path (str): The path to the local notebook.
        classifier (GPTClassifier): The classifier used to classify the code cells.
        client (FirebaseClient): The Firebase client used to interact with the database.
    """
    final_json = BLANK_IPYNB_JSON
        
    # Iterate over each uploaded notebook
    print(f"Reading file contents...")
    
    # Get all files in the directory
    files = os.listdir(dir_path)

    # Read contents of each file
    file_contents = []
    for file_name in files:
        file_path = os.path.join(dir_path, file_name)
        with open(file_path, 'r') as f:
            file_contents.append(f.read())

    # Process the file contents as needed
    # ...
    
    for notebook_id, file_name in enumerate(os.listdir(dir_path)):
        file_path = os.path.join(dir_path, file_name)
        
        if not file_name.endswith(".ipynb"):
            print(f"Invalid file format: {file_name}. Must end with .ipynb")
            return
        
        # Extract relevant data from the current notebook
        with open(file_path, 'r') as file: notebook_json = ipynb_to_json(file.read())
        notebook_code = notebook_extract_code(notebook_json)
        
        # Classify the code cells of the current notebook
        print(f"Classifying notebook ({notebook_id+1}/{len(files)})...", end="\r")
        cell_labels = classifier.classify_notebook(notebook_code)
        notebook_json = notebook_add_class_labels(notebook_json, cell_labels)
        
        # Reformat and add classified code cells to the final notebook
        for i in range(len(notebook_json['cells'])):
            cell = notebook_json['cells'][i]
            if cell['cell_type'] == 'code' and len(cell['source']):
                final_json['cells'].append({
                    "cell_type": cell['cell_type'],
                    "execution_count": cell['execution_count'],
                    "metadata": {
                        "start_cell": cell['metadata']['start_cell'],
                        "class": cell['metadata']['class'],
                        "cell_id": cell['metadata']['cell_id'],
                        "notebook_id": notebook_id,
                    },
                    "source": cell['source']
                })
    
    # Reorder cells by their class
    final_json['cells'] = sorted(final_json['cells'], key=lambda x: x['metadata']['class'])
    
    # Add metadata to the final notebook
    final_json['metadata'] = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.10.12"
        }
    }
    
    # Generate output name and save the file locally and in Firestore database
    output_name = generate_output_name(client=client)
    with open(f'{OUTPUT_DIR}/{output_name}.ipynb', 'w') as f: json.dump(final_json, f)

def classify_competition(competition_name: str, classifier: GPTClassifier, client: FirebaseClient):
    """Classify the code cells of notebooks from a given competition.

    Args:
        competition_name (str): The name of the competition.
        classifier (GPTClassifier): The classifier used to classify the code cells.
        client (FirebaseClient): The Firebase client used to interact with the database.
    """
    final_json = BLANK_IPYNB_JSON
    competition_name = sys.argv[3]

    notebooks = []
    # Pull notebooks from the given competition
    with tempfile.TemporaryDirectory() as temp_dir:
        notebooks = kaggle_pull_competiton(competition_name, temp_dir, n_notebooks=20, verbose=True)
    
    for notebook_id, notebook_json in enumerate(notebooks):
        notebook_code = notebook_extract_code(notebook_json)
        
        # Classify the code cells of the current notebook
        print(f"Classifying notebook ({notebook_id+1}/{len(notebooks)})...", end="\r")
        cell_labels = classifier.classify_notebook(notebook_code)
        notebook_json = notebook_add_class_labels(notebook_json, cell_labels)
        
        # Reformat and add classified code cells to the final notebook
        for i in range(len(notebook_json['cells'])):
            cell = notebook_json['cells'][i]
            if cell['cell_type'] == 'code' and len(cell['source']):
                final_json['cells'].append({
                    "cell_type": cell['cell_type'],
                    "execution_count": cell['execution_count'],
                    "metadata": {
                        "start_cell": cell['metadata']['start_cell'],
                        "class": cell['metadata']['class'],
                        "cell_id": cell['metadata']['cell_id'],
                        "notebook_id": notebook_id,
                    },
                    "source": cell['source']
                })
        
    # Reorder cells by their class
    final_json['cells'] = sorted(final_json['cells'], key=lambda x: x['metadata']['class'])
    
    # Add metadata to the final notebook
    final_json['metadata'] = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.10.12"
        }
    }
    
    # Generate output name and save the file locally and in Firestore database
    output_name = generate_output_name(client=client)
    with open(f'{OUTPUT_DIR}/{output_name}.ipynb', 'w') as f: json.dump(final_json, f)

def get_notebook(notebook_name: str, client: FirebaseClient):
    try:
        notebook = client.get_notebook(notebook_name)
        with open(f'{OUTPUT_DIR}/{notebook_name}.ipynb', 'w') as f: json.dump(notebook, f)
    except Exception as e:
        return print(f"An error occurred:\n{e.with_traceback()}")

def main():
    
    client = FirebaseClient()
    with open('../api_key.txt', 'r') as f: api_key = f'{f.read()}'
    LABELS = SECOND_LAYER_LABELS
    prompt = f"""Classify the code into {', '.join(LABELS[:-1])} or {LABELS[-2]}.
    Desired format:
    Class: <class_label>""" #TODO
    classifier = GPTClassifier(api_key=api_key, prompt=prompt, labels=LABELS)
    
    
    
    if len(sys.argv) > 4:
        print("Usage: python jupytergrader.py <argument1> [argument2] ...")
        sys.exit(1)
    
    elif sys.argv[1] == "classify":
        if sys.argv[2] == "-c":
            classify_competition(sys.argv[3], classifier, client)
            sys.exit(1)
        else:
            path = sys.argv[2]
            classify_local(path, classifier, client)
            sys.exit(1)
    elif sys.argv[1] == "get":
        get_notebook(sys.argv[2], client)
        sys.exit(1)
            
        
if __name__ == "__main__":
  main()