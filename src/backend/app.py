from flask import Flask, request, jsonify, render_template
import numpy as np
from Classifiers.GPTClassifier import GPTClassifier
from Clusterers.clusterer import ClassCluster
from utils.helper_functions import ipynb_to_json, notebook_extract_code, notebook_add_class_labels, kaggle_pull_competiton
from utils.constants import FIRST_LAYER_LABELS, SECOND_LAYER_LABELS, BLANK_IPYNB_JSON
from db.client import FirebaseClient
import json
import tempfile
import os
from tqdm import tqdm

app = Flask(__name__, template_folder="./template")
client = FirebaseClient()
with open('../secrets/api_key.txt', 'r') as f: api_key = f'{f.read()}'
os.environ["OPENAI_API_KEY"] = api_key


LABELS = FIRST_LAYER_LABELS
# LABELS = SECOND_LAYER_LABELS


print(f"Initializing classifier...")
prompt = f"""You will be given each code cell of the same jupyter notebook of a machine learning task.
First, classify the code into one {', '.join(LABELS[:-1])} or {LABELS[-1]}.
Consider the previously classified code snippets for context.
Then, describe what the code snippet does in strictly one sentence.
Explain your reasoning for the classification and then output the desired format at the end.
Desired format:
Class: <class_label>
Description: <desctiption_sentence>
""" 
classifier = GPTClassifier(api_key=api_key, prompt=prompt, labels=LABELS)
clusterer = ClassCluster()

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
        final_json = {
            'notebooks': [],
            'metadata': {}
        }
        
        # Iterate over each uploaded notebook
        print(f"Reading file contents...")
        for notebook_id, file in enumerate(files):
            notebook = {}
            if not file.filename.endswith(".ipynb"):
                return f"Invalid file format: {file.filename}", 400
            
            # Extract relevant data from the current notebook
            notebook_name = file.filename.split('.')[0]
            notebook_json = ipynb_to_json(file.read())
            
            if len([cell for cell in notebook_json['cells'] if cell['cell_type'] == 'code']) >= 15:
                # Classify the code cells of the current notebook
                print(f"Classifying notebook {notebook_name} ({notebook_id+1}/{len(files)})...", end="\r")
                classified_cells = classifier.classify_ipynb(notebook_json, embed=False, verbose=True)
                
                notebook["cells"] = sorted(classified_cells, key=lambda x: (x['class'], x['cell_id']))
                notebook["notebook_id"] = notebook_id
                notebook["notebook_name"] = notebook_name
                
                final_json['notebooks'].append(notebook)
            else:
                print(f"Skipping notebook {notebook_name} ({notebook_id+1}/{len(files)}) due to insufficient code cells.")

            
        # Reorder cells by their class        
        final_json = clusterer.cluster(final_json)
        print(final_json["notebooks"][0]["cells"][0])
        # Remove the "embeddings" property from each cell's metadata
        for notebook in tqdm(final_json["notebooks"], desc="Deleting embeddings from metadata"):
            for cell in notebook["cells"]:
                if "embedding" in cell:
                    del cell["embedding"]
                    
        # Write final_json to a JSON file
        print("Writing final notebook to JSON file.") 
        with open('../data/clustering_test.json', 'w') as f: json.dump(final_json, f)
                    
        preds = []
        truths = []
        for notebook in tqdm(final_json["notebooks"], desc="Evaluating clustering accuracy"):
            for cell in notebook["cells"]:
                print(cell)
                class_id = str(LABELS.index(cell["class"]))
                cluster = str(int(cell["cluster"])+1)
                cluster = int(f"{class_id}{cluster}")
                preds.append(cluster)
                truths.append(cell["metadata"]["subclass_id"])
                
        clustering_accuracy = clusterer.evaluate_clustering(np.array(truths), np.array(preds))
        print(f"Clustering accuracy: {clustering_accuracy*100:.2f}%")
        final_json["metadata"]["clustering_accuracy"] = clustering_accuracy
        
        # Write final_json to a JSON file
        print("Adding accuracy to final notebook JSON file.") 
        with open('../data/clustering_test.json', 'w') as f: json.dump(final_json, f)
       
        
        # Add the final notebook to the database
        print("Uploading final notebook to Firestore DB.") 
        client.add_notebook("clusterin_test", final_json)
            
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
    
    
@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        total_accuracy = 0
        total_misclassification_dict = {label: {"count": 0, "misclassified": 0} for label in LABELS}
        files = request.files.getlist("files")
        print(f"Evaluating on {len(files)+1} files...")
        if not files:
            return "No files uploaded!", 400
        
        print(f"Reading file contents...")
        for notebook_id, file in enumerate(files):
            if not file.filename.endswith(".ipynb"):
                return f"Invalid file format: {file.filename}", 400
            
            # Extract relevant data from the current notebook
            notebook_name = file.filename.split('.')[0]
            notebook_json = ipynb_to_json(file.read())
            
            # Classify the code cells of the current notebook
            print(f"Classifying notebook {notebook_name} ({notebook_id+1}/{len(files)})...")
            accuracy, misclassification_dict = classifier.evaluate(notebook_json, verbose=True)
            
            total_accuracy += accuracy
            total_misclassification_dict = {
                label: {
                    "count": total_misclassification_dict[label]["count"] + misclassification_dict[label]["count"],
                    "misclassified": total_misclassification_dict[label]["misclassified"] + misclassification_dict[label]["misclassified"]
                }
                for label in LABELS
            }
            
            
        total_accuracy /= len(files)
        print(f"Total accuracy: {total_accuracy:.2f}%")
        print(f"Class-specific misclassification:")
        for key, value in total_misclassification_dict.items():
            print(f"- {key}: {value['misclassified']}/{value['count']} misclassified")
            if value['count'] != 0:
                print(f"    Accuracy: {100 - (value['misclassified']/value['count']*100):.2f}%")
        return jsonify({"accuracy": total_accuracy})
    except Exception as e:
        return jsonify({"message": f"An error occurred:\n{e.with_traceback()}"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
