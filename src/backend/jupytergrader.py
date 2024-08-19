import sys
import os
from utils.helper_functions import load_notebooks, save_viz
from db.client import FirebaseClient
from utils.constants import FIRST_LAYER_LABELS, classifier_prompt
from Clusterers.clusterer import ClassCluster, hungarian_clustering_accuracy
import json
from tqdm import tqdm
import numpy as np
import concurrent.futures
from cli.main_methods import classify_notebooks, evaluate_clustering_accuracy


client = FirebaseClient()
LABELS = FIRST_LAYER_LABELS
clusterer = ClassCluster()


def main():
    if len(sys.argv) != 2:
        print("Usage: python jupytergrader.py <notebook_directory>")
        return
    input_directory = sys.argv[1]
    output_filepath = '../output/final_file.viz'

    if not os.path.isdir(input_directory):
        print("Input directory does not exist.")
        return

    notebook_jsons, file_names = load_notebooks(input_directory)
    final_json = classify_notebooks(notebook_jsons, file_names)
            
    # Write final_json to a JSON file (Checkpoint)
    print("Writing classified final notebook to .viz file.") 
    save_viz(final_json, output_filepath)
    
    final_json = clusterer.cluster(final_json, LABELS)
    
    # Write final_json to a JSON file (Checkpoint)
    print("Overwriting clustered final notebook to .viz file.") 
    save_viz(final_json, output_filepath)
            
    clustering_accuracy = evaluate_clustering_accuracy(final_json)
    if clustering_accuracy:
        print(f"Clustering accuracy: {clustering_accuracy*100:.2f}%")
        final_json['metadata']['clustering_accuracy'] = clustering_accuracy 

        # Write final_json to a JSON file (Checkpoint)
        print("Overwriting clustered final notebook to .viz file.")
        save_viz(final_json, output_filepath)
        
    # Add the final notebook to the database
    print("Uploading final notebook to Firestore DB.") 
    client.add_notebook("final_file", final_json)

if __name__ == "__main__":
    main()