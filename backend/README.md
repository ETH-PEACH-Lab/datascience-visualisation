# API Endpoints

This README provides an overview of the different endpoints available in the PEACHLab backend API.

## User Endpoints

- `/`: Home address. Consists of a very simple interface to load .ipynb files. When clicking on "Upload", a POST request is sent to `/classify` with the uploaded .ipynb files.

- `/classify` - POST: Send a list of .ipynb files with the requests. Classifies each code cell of each notebook and combines all notebooks into 1 single notebook. The notebook is returned in the response JSON object. Additionally, it is stored in a Firebase Firestore database.

- `/classify/<competition_name>` - POST: This endpoint is similar to the previous one, but it expects an additional parameter called <competition_name>. It allows users to classify and combine notebooks specific to a particular competition. The <competition_name> is used to download and organize the notebooks of that competition.

- `/notebook/<notebook_name>` - GET: Returns as a JSON object the classified notebook <notebook_name> from the Firebase Firestore database.



Please refer to the API documentation for more details on how to use these endpoints.
