import firebase_admin
from firebase_admin import credentials, firestore
from typing import List

class FirebaseClient():
    """A class representing a Firebase client.

    This class provides methods to interact with the Firebase database.

    Attributes:
        _db (google.cloud.firestore.Client): The Firestore client instance.

    """

    def __init__(self) -> None:
        cred = credentials.Certificate("../../secrets/serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        self._db = firestore.client()

    def add_notebook(self, notebook_name: str, notebook: dict) -> None:
        """Add a labeled notebook to the database.
        
        Args:
            notebook_name (str): The name of the notebook.
            labeled_notebook (List[str, str]): A list of tuples containing the cell code and cell label.
        
        Returns:
            None
        """
        self._db.collection("notebooks").document(notebook_name).set(notebook)
        
    def get_notebook(self, notebook_name: str) -> dict:
        """Retrieve a notebook from the database.

        Args:
            notebook_name (str): The name of the notebook to retrieve.

        Returns:
            dict: A dictionary representing the retrieved notebook.
        """
        return self._db.collection("notebooks").document(notebook_name).get().to_dict()
    
    def notebook_exists(self, notebook_name: str) -> bool:
        """Check if a notebook exists in the database.

        Args:
            notebook_name (str): The name of the notebook to check.

        Returns:
            bool: True if the notebook exists, False otherwise.
        """
        return self._db.collection("notebooks").document(notebook_name).get().exists
