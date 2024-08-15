

FIRST_LAYER_LABELS = [
    "Data_Transform",
    "Data_Extraction",
    "Visualization",
    "Hyperparam_Tuning",
    "Model_Interpretation",
    "Model_Train",
    "Model_Evaluation",
    "Debug",
    "Environment",
    "Data_Export",
    "Exploratory_Data_Analysis",
    "Other"
]

SECOND_LAYER_LABELS = [
    # Hyperparam_Tuning
    "find_best_score",
    "find_best_params",
    "find_best_model_class",
    "define_search_space",
    "train_on_grid",
    "define_search_model",
    
    # Model_Train
    "choose_model_class",
    "train_model",
    "predict_on_train",
    "compute_train_metric",
    "load_pretrained",
    "save_model"
    "init_hyperparams",
    "build_layers",
    
    # Data_Transform
    "feature_engineering",
    "sort_values",
    "drop_column",
    "concatenate",
    "create_dataframe",
    "split",
    "filter",
    "randomize_order",
    "data_type_conversions",
    "correct_missing_values",
    "normalization",
    "remove_duplicates",
    "categorify",
    "prepare_x_and_y",
    "augment",
    "merge",
    "groupby",
    "rename_columns",
    "string_transform",
    
    # Environment
    "import_modules",
    "set_options",
    "install_modules",
    
    # Data_Export
    "save_to_csv",
    "prepare_output",
    
    # Visualization
    "distribution",
    "missing_values",
    "learning_history",
    "wandb",
    "plot_predictions",
    "time_series",
    "model_coefficients",
    "heatmap",
    "relationship",
    "plot_metrics",
    "images",
        
    # Exploratory Data Analysis
    "count_data_types",
    "count_duplicates",
    "count_missing_values",
    "count_unique_values",
    "count_values",
    
    # Debug
    "show_table_attributes",
    "show_table",
    "show_unique_values",
    "show_shape",
    "show_data_types",
    "show_columns",
    "commented_code",
    "list_files",
    
    # Data_Extraction
    "load_from_url",
    "load_from_sql",
    "load_from_disk",
    "load_from_csv",
    "load_from_zip",
    "prepare_data_loader",
    
    # Model_Evaluation
    "statistical_test",
    "predict_on_test",
    "compute_test_metric",
    
    # Model_Interpretation
    "features_selection",
    
    # Other
    "something_strange",
    "define_variables",
    "not_enough_vertices"
]

BLANK_IPYNB_JSON = {
    "cells": [],
    "metadata": {
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
        },
        "visualization": True
    },
    "nbformat": 4,
    "nbformat_minor": 4    
}
