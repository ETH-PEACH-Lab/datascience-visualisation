import torch
from transformers import AutoTokenizer, AutoModel
from sklearn.cluster import HDBSCAN
from typing import List

class Clusterer():
    
    def __init__(self) -> None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        self._model = AutoModel.from_pretrained("microsoft/codebert-base")
        self._model.to(device)
        
        self.clusterer: HDBSCAN = HDBSCAN()
        
        
    def embed(self, code: str, summary: str = None) -> torch.Tensor:
        """
        Embeddes the given code and summary (if provided).

        Args:
            code (str): The code to be embedded.
            summary (str, optional): An NL-summary of the code for better embedding. Defaults to None.

        Returns:
            torch.Tensor: The tokenized code and summary (if provided) embeddings.
        """
        code_tokens = self._tokenizer.tokenize(code)
        tokens = []
        if summary:
            nl_tokens = self._tokenizer.tokenize(summary)
            tokens = [self._tokenizer.cls_token] + nl_tokens + [self._tokenizer.sep_token]
        tokens += code_tokens + [self._tokenizer.eos_token]
        tokens_ids = self._tokenizer.convert_tokens_to_ids(tokens)
        context_embeddings = self._model(torch.tensor(tokens_ids)[None,:])[0]
        return context_embeddings
    
    def cluster(self, codes: List[str]) -> List[int]:
        
        embedded_code = [self.embed(code) for code in codes]
        self.clusterer.fit(embedded_code)
        return self.clusterer.labels_
        