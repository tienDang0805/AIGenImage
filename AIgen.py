import os
import google.generativeai as genai

genai.configure(api_key="AIzaSyCEphH-oXMWMGkNkWmiTfjvWS1QRjtSb1o")

# Check available models (optional)
print("Available Models:")
for model in genai.list_models(page_size=100):
  print(model.name)

imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")

try:
  result = imagen.generate_images(
      prompt="Fuzzy bunnies in my kitchen",
      number_of_images=4,
      safety_filter_level="block_only_high",
      person_generation="allow_adult",
      aspect_ratio="3:4",
      negative_prompt="Outside",
  )

  for image in result.images:
    print(image)
    image._pil_image.show()
except google.api_core.exceptions.NotFound as e:
  print(f"Error: {e}")