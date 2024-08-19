import sys
import os
from utils.helper_functions import load_notebook
from db.client import FirebaseClient
from Classifiers.GPTClassifier import GPTClassifier
from utils.constants import FIRST_LAYER_LABELS, classifier_prompt
from Clusterers.clusterer import ClassCluster, hungarian_clustering_accuracy
import json
from tqdm import tqdm
import numpy as np
import concurrent.futures





client = FirebaseClient()
with open('../../secrets/api_key.txt', 'r') as f: api_key = f'{f.read()}'
os.environ["OPENAI_API_KEY"] = api_key
LABELS = FIRST_LAYER_LABELS
clusterer = ClassCluster()

def classify(notebook_json):
    classifier = GPTClassifier(
        api_key=api_key, 
        prompt=classifier_prompt(LABELS), 
        labels=LABELS
    )   
    return classifier.classify_ipynb(notebook_json, embed=False, verbose=False)

def main():
    if len(sys.argv) != 2:
        print("Usage: python jupytergrader.py <notebook_directory>")
        return
    input_directory = sys.argv[1]
    output_directory = "../output"
    if not os.path.isdir(input_directory):
        print("Input directory does not exist.")
        return

    # Initialize the final notebook which will condense all classified notebooks
    final_json = {
        'notebooks': [],
        'metadata': {}
    }

    # Read files from input directory
    files = os.listdir(input_directory)
    notebook_jsons = []
    for file in tqdm(files, desc="Reading file contents"):
        notebook = {}
        file_path = os.path.join(input_directory, file)
        
        if os.path.isfile(file_path) and file.endswith(".ipynb"):
            notebook_json = load_notebook(file_path)
            if len([cell for cell in notebook_json['cells'] if cell['cell_type'] == 'code']) >= 15:
                notebook_jsons.append(notebook_json)
            else:
                print(f"Skipping notebook {file} ({notebook_id+1}/{len(files)}) due to insufficient code cells.")
        else:
            print("Invalid file format. Skipping file: " + file)
            
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(classify, notebook_jsons))
        for notebook_id, classified_cells in enumerate(results):
            notebook["cells"] = sorted(classified_cells, key=lambda x: (x['class'], x['cell_id']))
            notebook["notebook_id"] = notebook_id
            final_json['notebooks'].append(notebook)
            
    # Write final_json to a JSON file (Checkpoint)
    print("Writing classified final notebook to JSON file.") 
    with open(f'{output_directory}/final_file.viz', 'w') as f: json.dump(final_json, f)
    
    final_json = clusterer.cluster(final_json, LABELS)
    
    # Write final_json to a JSON file (Checkpoint)
    print("overwriting clustered final notebook to JSON file.") 
    with open(f'{output_directory}/final_file.viz', 'w') as f: json.dump(final_json, f)
            
    preds = []
    truths = []
    for notebook in tqdm(final_json["notebooks"], desc="Evaluating clustering accuracy"):
        for cell in notebook["cells"]:
            if "testing" in cell:
                class_id = str(LABELS.index(cell["class"]))
                cluster = str(int(cell["cluster"])+1)
                cluster = int(f"{class_id}{cluster}")
                preds.append(cluster)
                truths.append(cell["testing"]["subclass_id"])
                
    if len(preds) == len(truths) and len(preds):
        clustering_accuracy = hungarian_clustering_accuracy(np.array(truths), np.array(preds))
        print(f"Clustering accuracy: {clustering_accuracy*100:.2f}%")
        final_json["metadata"]["clustering_accuracy"] = clustering_accuracy
        
        # Write final_json to a JSON file
        print("Overwriting evaluated final notebook JSON file.") 
        with open(f'{output_directory}/final_file.viz', 'w') as f: json.dump(final_json, f)
        
    # Add the final notebook to the database
    print("Uploading final notebook to Firestore DB.") 
    client.add_notebook("final_file", final_json)

if __name__ == "__main__":
    main()