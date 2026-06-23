"""
GeoGuard AI - Computer Vision Classifier (Module 5)
Uses OpenCV DNN to load and execute YOLOv8 ONNX models for disaster image classification.
"""
import os
import cv2
import numpy as np
from typing import Tuple


class DisasterCVClassifier:
    def __init__(self):
        self.model_path = "ml/models/disaster_yolo.onnx"
        self.net = None
        self.classes = ["flood", "fire", "road blockage", "fallen trees"]
        
        if os.path.exists(self.model_path):
            try:
                # Load ONNX model using OpenCV DNN
                self.net = cv2.dnn.readNetFromONNX(self.model_path)
                print("DisasterCVClassifier: Loaded custom YOLO ONNX model successfully.")
            except Exception as e:
                print(f"DisasterCVClassifier: Failed to load YOLO ONNX model: {e}")

    def classify_image(self, image_path: str, description: str = "") -> Tuple[str, int, float]:
        """
        Classifies the image using YOLOv8 ONNX model.
        Returns:
            Tuple of (detected_class, severity_level, confidence_score)
        """
        if self.net is not None and os.path.exists(image_path):
            try:
                # Read image
                img = cv2.imread(image_path)
                if img is None:
                    raise Exception("Could not read image file")
                
                # YOLOv8 input size: 640x640, scale factor 1/255.0, swapRB=True
                blob = cv2.dnn.blobFromImage(img, 1/255.0, (640, 640), swapRB=True, crop=False)
                self.net.setInput(blob)
                outputs = self.net.forward()
                
                # outputs shape: (1, 8, 8400)
                # Parse detections
                detections = outputs[0]  # shape: (8, 8400)
                
                best_class_idx = -1
                best_conf = 0.0
                
                # We find the detection with the highest class confidence
                for i in range(8400):
                    scores = detections[4:, i]
                    class_idx = np.argmax(scores)
                    conf = float(scores[class_idx])
                    
                    if conf > best_conf:
                        best_conf = conf
                        best_class_idx = class_idx
                
                # If a valid detection is found with confidence > 0.25
                if best_conf > 0.25 and best_class_idx != -1:
                    detected_class = self.classes[best_class_idx]
                    # Map confidence to severity (1 to 5)
                    severity = min(5, max(1, int(best_conf * 5)))
                    return detected_class, severity, best_conf
            except Exception as e:
                print(f"DisasterCVClassifier: ONNX forward pass failed: {e}. Using fallback classifier.")

        # Fallback keyword classifier based on description
        desc_lower = description.lower()
        
        detected_class = "other"
        severity = 2
        confidence = 0.85
        
        if any(w in desc_lower for w in ["flood", "water", "submerge", "overflow", "drown", "logging"]):
            detected_class = "flood"
            severity = 4 if any(w in desc_lower for w in ["heavy", "deep", "rescue", "danger", "critical"]) else 3
        elif any(w in desc_lower for w in ["fire", "smoke", "burn", "flame", "blaze"]):
            detected_class = "fire"
            severity = 5 if any(w in desc_lower for w in ["spread", "cylinder", "house", "building"]) else 3
        elif any(w in desc_lower for w in ["block", "obstruction", "jam", "barrier", "debris", "road"]):
            detected_class = "road blockage"
            severity = 4 if any(w in desc_lower for w in ["highway", "main road", "traffic", "expressway"]) else 2
        elif any(w in desc_lower for w in ["tree", "branch", "trunk", "fall", "fallen"]):
            detected_class = "fallen trees"
            severity = 3
            
        return detected_class, severity, confidence
