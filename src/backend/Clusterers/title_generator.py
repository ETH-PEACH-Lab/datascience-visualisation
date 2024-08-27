from openai import OpenAI, BadRequestError
from typing import List
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re
from tqdm import tqdm

class TitleGenerator:
    def __init__(self):
        self.client = OpenAI()
        self.messages = []
        
    def generate_titles_from_descs(self, clusters, descriptions, class_name):
        self._init_prompt(class_name)
        unique_clusters = set(clusters)
        cluster_titles = {}
        
        for cluster in tqdm(unique_clusters):
            cluster_descriptions = [descriptions[i] for i in range(len(descriptions)) if clusters[i] == cluster]
            cluster_descriptions_str = "\n".join(cluster_descriptions)
            
            messages = self.messages.copy()
            messages.append({
                "role": "user",
                "content": cluster_descriptions_str
            })
            title, short_title = self._gen_title(messages)
            messages.append({
                "role": "assistant",
                "content": title
            })
            cluster_titles[str(cluster)] = [short_title, title]
        return cluster_titles

    
    def generate_titles_from_embeddings(self, embeddings, clusters, descriptions):
        unique_clusters = set(clusters)
        cluster_titles = {}
        
        for cluster in unique_clusters:
            # Get the embeddings and descriptions for the current cluster
            cluster_embeddings = [embeddings[i] for i in range(len(embeddings)) if clusters[i] == cluster]
            cluster_descriptions = [descriptions[i] for i in range(len(descriptions)) if clusters[i] == cluster]
            
            # Compute the centroid of the cluster
            centroid = self._compute_centroid(cluster_embeddings)
            
            # Find the nearest description
            representative_description = self._find_nearest_description(centroid, cluster_embeddings, cluster_descriptions)
            
            # Optionally, you can refine this with a language model to generate a shorter title.
            cluster_titles[str(cluster)] = representative_description
        
        return cluster_titles
    
    #######################################
    ########### Private methods ###########
    #######################################
    
    def _init_prompt(self, class_name):
        prompt = f"""You are given a set of descriptions for multiple code snippets of a same cluster. 
        The snipets are classified as {class_name}.
        Generate a title for the cluster based on the descriptions, as short as possible, in 6 words maximum.
        Be very specific and explicit about the technologies used. Don't repeat the class label in the title.
        Don't repeat word choices between titles !
        Also generate a shorter title in 3 words maximum.
        Desired format:
        Title: <generated_title>
        Short Title: <short_title>
        """
        
        self.messages = [
            {
                "role": "system", 
                "content": prompt
            },
        ]
    
    def _compute_centroid(self, embeddings):
        return np.mean(embeddings, axis=0)
    
    def _find_nearest_description(self, centroid, embeddings, descriptions):
        similarities = cosine_similarity([centroid], embeddings)[0]
        # Find the index of the most similar embedding
        nearest_idx = int(np.argmax(similarities))
        # Return the description corresponding to that embedding
        return descriptions[nearest_idx]
    
    
    def _gen_title(self, messages: List[dict], verbose: bool = False):
        """
        Makes a prediction based on the provided messages.

        Args:
            messages (List[dict]): A list of messages exchanged between the user and the assistant.

        Returns:
            str: The predicted label.
        """
        title = None
        short_title = None
        while not title:   
            # TODO: add timeout mechanism 
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="gpt-4o"
            )
            response = chat_completion.choices[0].message.content
            
            title_generated = False
            match = re.search(r"Title: (.+)\nShort Title: (.+)", response)
            
            if match: 
                title = match.group(1)
                short_title = match.group(2)
                title_generated = True

            if verbose and not title_generated: print(f"[ERROR] Response title invalid:\n{response}\n\nRetrying...", end="\r")
        return title, short_title