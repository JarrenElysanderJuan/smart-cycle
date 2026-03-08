import requests
import time
import numpy as np
import torch
from torch import nn
import torchvision.models as models
from torchvision import transforms
import random
import cv2
import sys

url = "http://oppo-reno3-a:8080"

requests.get(f"{url}/enabletorch")
time.sleep(1)
img_resp = requests.get(f"{url}/shot.jpg")
requests.get(f"{url}/disabletorch")
img_arr = np.frombuffer(img_resp.content, dtype=np.uint8)
img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

seed = 42
random.seed(seed)
np.random.seed(seed)
torch.manual_seed(seed)
if torch.cuda.is_available():
    torch.cuda.manual_seed(seed)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

inference_model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
inference_model.fc = nn.Linear(inference_model.fc.in_features, 4)
inference_model.load_state_dict(torch.load("models/best_model.pth", map_location=torch.device('cpu')))
inference_model = inference_model.to(device)
inference_model.eval()

classes = ['overripe', 'ripe', 'rotten', 'unripe']
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

tensor = transform(img).unsqueeze(0)

with torch.no_grad():
    output = inference_model(tensor)

pred = output.argmax(1).item()
print(classes[pred])

