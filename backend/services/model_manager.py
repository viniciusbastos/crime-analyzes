import os
from typing import Optional, Tuple
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler, make_logits_processors


class ModelManager:
    """Manages MLX model loading and inference"""

    def __init__(self, model_path: str = "mlx-community/gpt-oss-20b-MXFP4-Q8"):
        self.model_path = model_path
        self.model = None
        self.tokenizer = None

    def load_model(self) -> Tuple[Optional[object], Optional[object]]:
        """Load the MLX model (lazy loading)"""
        if self.model is None:
            try:
                print(f"Loading MLX model: {self.model_path}")
                self.model, self.tokenizer = load(self.model_path)
                print("Model loaded successfully")
            except Exception as e:
                print(f"Error loading model: {e}")
                raise e
        return self.model, self.tokenizer

    def generate_response(self, prompt: str, max_tokens: int = 40048, temp: float = 0.7, top_p: float = 0.9) -> str:
        """Generate response using the loaded model"""
        model, tokenizer = self.load_model()
        if model is None or tokenizer is None:
            raise ValueError("Model not loaded")

        sampler = make_sampler(temp=temp, top_p=top_p)
        logits_processors = make_logits_processors(repetition_penalty=1.1)

        return generate(
            model,
            tokenizer,
            prompt,
            max_tokens=max_tokens,
            sampler=sampler,
            logits_processors=logits_processors
        )