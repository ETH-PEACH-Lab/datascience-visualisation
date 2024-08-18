# Testing
1. Generate a dataset for testing:
    - Go to `/utils/create_test_dataset.ipynb` to download pre-classified notebooks from the Code4ML dataset.
    - Specify the labels you want to use for classification later in a cell.
    - The notebooks will be stored in the `/data/datasets/<competition_name>/unclassified/` directory. The labels used for this classification will be stored in the metadata of each file.
2. Classify the notebooks:
    - Go to `/Classifiers/evaluating_classification.ipynb`.
    - Load the notebook files of the competition you want, ideally from `/data/datasets/<competition_name>/unclassified/`.
    - The labels are loaded from these files.
    - Run the classification cells.
    - The classified notebooks will be stored in a JSON file `/data/datasets/<competition_name>/classified_notebooks.json`. This file has the same structure as a .viz file, just with the missing clusters.
3. Cluster the notebooks:
    - In the `test_clustering.ipynb` notebook, load the file with the classified notebooks and perform your tests for clustering.
