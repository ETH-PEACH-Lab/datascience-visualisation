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

with open('../../secrets/api_key.txt', 'r') as f: api_key = f'{f.read()}'
os.environ["OPENAI_API_KEY"] = api_key
LABELS = FIRST_LAYER_LABELS

def classify_notebooks(notebook_jsons: list[dict], file_names: list[str]) -> dict: 
    """
    Classifies the given list of notebook JSONs and returns a dictionary containing the classified notebooks.
    
    Parameters:
    notebook_jsons (list[dict]): A list of notebook JSONs to be classified.
    
    Returns:
    dict: A dictionary containing the classified notebooks. The dictionary has the following structure:
        {
            'notebooks': [
                {
                    'cells': [
                        {
                            'class': str,
                            'cell_id': int,
                            ...
                        },
                        ...
                    ],
                    'notebook_id': int,
                },
                ...
            ],
            'metadata': dict,
    """
       
    final_json = {
        'notebooks': [],
        'metadata': {}
    }
    # results = []
    # for notebook_json in notebook_jsons:
    #     results.append(_classify(notebook_json))
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(_classify, notebook_jsons))
        for notebook_id, classified_cells in enumerate(results):
            notebook = {}
            notebook["cells"] = sorted(classified_cells, key=lambda x: (x['class'], x['cell_id']))
            notebook["notebook_id"] = notebook_id
            notebook["notebook_name"] = file_names[notebook_id].split('_')[-1]
            notebook["user"] = file_names[notebook_id].split('_')[0]
            final_json['notebooks'].append(notebook)
            
    return final_json


def evaluate_clustering_accuracy(final_json: dict) -> float:
    """
    Evaluates the clustering accuracy of the given final JSON.
    
    Parameters:
    final_json (dict): The final JSON to evaluate.
    
    Returns:
    float: The clustering accuracy.
    """
    
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
        return hungarian_clustering_accuracy(np.array(truths), np.array(preds))        
    else: 
        return 0
            
            
#####################################
######### Private Functions ##########
#####################################
            
def _classify(notebook_json: dict) -> list[dict]:
    """
    Classify the given notebook JSON using the GPTClassifier.
    
    Parameters:
        notebook_json (dict): The JSON representation of the notebook to be classified.
    
    Returns:
        list[dict]: The list of classified cells.
    """
    classifier = GPTClassifier(
        api_key=api_key, 
        prompt=classifier_prompt(LABELS), 
        labels=LABELS
    )   
    return classifier.classify_ipynb(notebook_json, embed=False, verbose=False)