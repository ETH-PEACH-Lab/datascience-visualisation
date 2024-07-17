from flask import Flask, request, jsonify, render_template
from Classifiers.GPTClassifier import GPTClassifier
from utils.helper_functions import ipynb_to_json, notebook_extract_code, notebook_add_class_labels, kaggle_pull_competiton
from utils.constants import FIRST_LAYER_LABELS, SECOND_LAYER_LABELS, BLANK_IPYNB_JSON
from client import FirebaseClient
import json
import tempfile


app = Flask(__name__, template_folder="./template")
client = FirebaseClient()
with open('../api_key.txt', 'r') as f: api_key = f'{f.read()}'


# LABELS = FIRST_LAYER_LABELS
LABELS = SECOND_LAYER_LABELS


print(f"Initializing classifier...")
prompt = f"""Classify the code into {', '.join(LABELS[:-1])} or {LABELS[-2]}.
Desired format:
Class: <class_label>""" #TODO
classifier = GPTClassifier(api_key=api_key, prompt=prompt, labels=LABELS)

@app.route("/")
def index():
    return render_template("index.html")
    
@app.route("/classify", methods=["POST"])
def classify():
    """
    Classifies a list of uploaded notebook files.

    Returns:
        A JSON response containing the message and the classified notebooks as one condensed notebook.
    """
    try:
        files = request.files.getlist("files")
        print(f"Classifying {len(files)+1} files...")
        if not files:
            return "No files uploaded!", 400
        
        # Initialize the final notebook which will condense all classified notebooks
        final_json = BLANK_IPYNB_JSON
        
        # Iterate over each uploaded notebook
        print(f"Reading file contents...")
        for notebook_id, file in enumerate(files):
            if not file.filename.endswith(".ipynb"):
                return f"Invalid file format: {file.filename}", 400
            
            # Extract relevant data from the current notebook
            notebook_name = file.filename.split('.')[0]
            notebook_json = ipynb_to_json(file.read())
            notebook_code = notebook_extract_code(notebook_json)
            
            # Classify the code cells of the current notebook
            print(f"Classifying notebook {notebook_name} ({notebook_id+1}/{len(files)})...", end="\r")
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
        
        # Write final_json to a JSON file
        with open('../data/final_test.json', 'w') as f: json.dump(final_json, f)
        
        # Add the final notebook to the database
        client.add_notebook("final_test2", final_json)
            
        return jsonify(final_json)
    except Exception as e:
        return jsonify({"message": f"An error occurred:\n{e.with_traceback()}"})
    
@app.route("/<competition_name>", methods=["POST"])
def classify_competition(competition_name: str):
    final_json = BLANK_IPYNB_JSON
    
    try:
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
        
        # Write final_json to a JSON file
        with open('../data/final_test2.json', 'w') as f: json.dump(final_json, f)
        
        # Add the final notebook to the database
        client.add_notebook("final_test2", final_json)
            
        return jsonify(final_json)
    except Exception as e:
        return jsonify({"message": f"An error occurred:\n{e.with_traceback()}"})
        
        
@app.route("/notebook/<notebook_name>", methods=["GET"])
def get_notebook(notebook_name: str):
    """
    Retrieves a notebook from the database.

    Returns:
        A JSON response containing the retrieved notebook.
    """
    try:
        notebook = client.get_notebook(notebook_name)
        return jsonify(notebook)
    except Exception as e:
        return jsonify({"message": f"An error occurred:\n{e.with_traceback()}"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
