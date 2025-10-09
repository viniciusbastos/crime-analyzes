import os
from typing import Optional, Tuple
try:
    from mlx_lm import load, generate
    from mlx_lm.sample_utils import make_sampler, make_logits_processors
    MLX_AVAILABLE = True
except ImportError:
    MLX_AVAILABLE = False
    print("MLX not available, using transformers fallback")

from transformers import pipeline


class ModelManager:
    """Manages model loading and inference"""

    def __init__(self, model_path: str = "mlx-community/gpt-oss-20b-MXFP4-Q8"):
        self.model_path = model_path
        self.model = None
        self.tokenizer = None
        self.use_mlx = MLX_AVAILABLE

    def load_model(self) -> Tuple[Optional[object], Optional[object]]:
        """Load the model (lazy loading)"""
        if self.model is None:
            try:
                if self.use_mlx:
                    print(f"Loading MLX model: {self.model_path}")
                    self.model, self.tokenizer = load(self.model_path)
                    print("MLX Model loaded successfully")
                else:
                    print("Loading transformers model for text generation")
                    self.model = pipeline("text-generation", model="gpt2")
                    self.tokenizer = None
                    print("Transformers model loaded successfully")
            except Exception as e:
                print(f"Error loading model: {e}")
                raise e
        return self.model, self.tokenizer

    def generate_response(self, prompt: str, max_tokens: int = 40048, temp: float = 0.7, top_p: float = 0.9) -> str:
        """Generate response using the loaded model"""
        model, tokenizer = self.load_model()
        if model is None:
            raise ValueError("Model not loaded")

        if self.use_mlx:
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
        else:
            # Use transformers pipeline
            result = self.model(prompt, max_length=min(len(prompt.split()) + max_tokens, 1024), temperature=temp, top_p=top_p, do_sample=True, pad_token_id=50256)
            return result[0]['generated_text'][len(prompt):].strip()