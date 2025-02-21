import os
import tkinter as tk
from tkinter import filedialog, Scrollbar
from PIL import Image, ImageTk

# Final output dimensions (fixed)
FINAL_W = 646
FINAL_H = 1769

# The aspect ratio that must be maintained (width/height)
ASPECT_RATIO = FINAL_W / FINAL_H  # ~0.365

def main():
    root = tk.Tk()
    root.title("Crop & Resize Tool (646x1769)")

    # Step 1: Choose an image
    file_path = filedialog.askopenfilename(
        title="Select an image",
        filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.bmp;*.gif")]
    )
    if not file_path:
        print("No file selected. Exiting.")
        root.destroy()
        return

    # Load the image at full resolution
    orig_image = Image.open(file_path)
    orig_w, orig_h = orig_image.size

    # Create a scrollable frame to hold the full image
    frame = tk.Frame(root)
    frame.pack(fill=tk.BOTH, expand=True)

    h_scroll = tk.Scrollbar(frame, orient=tk.HORIZONTAL)
    h_scroll.pack(side=tk.BOTTOM, fill=tk.X)

    v_scroll = tk.Scrollbar(frame, orient=tk.VERTICAL)
    v_scroll.pack(side=tk.RIGHT, fill=tk.Y)

    canvas = tk.Canvas(
        frame,
        xscrollcommand=h_scroll.set,
        yscrollcommand=v_scroll.set,
        width=800,   # visible canvas width
        height=600,  # visible canvas height
        bg="white"
    )
    canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    h_scroll.config(command=canvas.xview)
    v_scroll.config(command=canvas.yview)

    # Convert the original image for Tkinter display
    tk_image = ImageTk.PhotoImage(orig_image)
    canvas.create_image(0, 0, anchor=tk.NW, image=tk_image)
    canvas.config(scrollregion=(0, 0, orig_w, orig_h))

    # ===========================
    # Crop Rectangle ("Schablone")
    # ===========================
    # We track the rectangle by its center and height so we can maintain the aspect ratio.

    # Set an initial rectangle height (at least 50, at most full image height)
    initial_rect_height = min(max(orig_h // 2, 50), orig_h)
    initial_rect_width = int(initial_rect_height * ASPECT_RATIO)

    # Place the rectangle in the center of the image
    rect_data = {
        "center_x": orig_w // 2,
        "center_y": orig_h // 2,
        "width": initial_rect_width,
        "height": initial_rect_height
    }

    # Create the rectangle on the canvas (coordinates will be updated below)
    rect_id = canvas.create_rectangle(0, 0, 0, 0, outline="red", width=2)

    def clamp_rect():
        """
        Ensure the rectangle stays within the image boundaries by clamping its center.
        """
        half_w = rect_data["width"] / 2
        half_h = rect_data["height"] / 2

        min_cx = half_w
        max_cx = orig_w - half_w
        if rect_data["center_x"] < min_cx:
            rect_data["center_x"] = min_cx
        if rect_data["center_x"] > max_cx:
            rect_data["center_x"] = max_cx

        min_cy = half_h
        max_cy = orig_h - half_h
        if rect_data["center_y"] < min_cy:
            rect_data["center_y"] = min_cy
        if rect_data["center_y"] > max_cy:
            rect_data["center_y"] = max_cy

    def update_rect():
        """
        Update the canvas rectangle coordinates based on rect_data.
        """
        half_w = rect_data["width"] / 2
        half_h = rect_data["height"] / 2
        x1 = rect_data["center_x"] - half_w
        y1 = rect_data["center_y"] - half_h
        x2 = rect_data["center_x"] + half_w
        y2 = rect_data["center_y"] + half_h
        canvas.coords(rect_id, x1, y1, x2, y2)

    def set_rect_size(new_height):
        """
        Adjust the rectangle's height (and width, keeping the aspect ratio) when the Scale widget moves.
        """
        rect_data["height"] = float(new_height)
        rect_data["width"] = rect_data["height"] * ASPECT_RATIO
        clamp_rect()
        update_rect()

    # Initialize rectangle size and position
    clamp_rect()
    update_rect()

    # =====================
    # Drag (Moving) Logic
    # =====================
    drag_data = {"x": 0, "y": 0, "dragging": False}

    def on_press(event):
        # Translate widget coordinates to canvas coordinates
        cx = canvas.canvasx(event.x)
        cy = canvas.canvasy(event.y)
        # If the click is inside the rectangle, start dragging
        items = canvas.find_overlapping(cx, cy, cx, cy)
        if rect_id in items:
            drag_data["dragging"] = True
            drag_data["x"] = cx
            drag_data["y"] = cy

    def on_drag(event):
        if drag_data["dragging"]:
            cx = canvas.canvasx(event.x)
            cy = canvas.canvasy(event.y)
            dx = cx - drag_data["x"]
            dy = cy - drag_data["y"]
            # Update the rectangle center by the drag distance
            rect_data["center_x"] += dx
            rect_data["center_y"] += dy
            drag_data["x"] = cx
            drag_data["y"] = cy
            clamp_rect()
            update_rect()

    def on_release(event):
        drag_data["dragging"] = False

    canvas.bind("<ButtonPress-1>", on_press)
    canvas.bind("<B1-Motion>", on_drag)
    canvas.bind("<ButtonRelease-1>", on_release)

    # =====================
    # Scale Widget for Resizing Crop Rectangle
    # =====================
    scale_frame = tk.Frame(root)
    scale_frame.pack(side=tk.TOP, fill=tk.X, pady=5)

    tk.Label(scale_frame, text="Crop Rectangle Height").pack(side=tk.LEFT, padx=5)
    height_scale = tk.Scale(
        scale_frame,
        from_=50,
        to=orig_h,
        orient=tk.HORIZONTAL,
        command=set_rect_size
    )
    height_scale.set(initial_rect_height)
    height_scale.pack(side=tk.LEFT, fill=tk.X, expand=True)

    # =====================
    # Save Crop Button
    # =====================
    def save_crop():
        """
        Crop the area defined by the rectangle from the original image,
        resize it to 646×1769, and save it in an "images" subfolder.
        """
        coords = canvas.coords(rect_id)  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = map(int, coords)
        if x2 <= x1 or y2 <= y1:
            print("Invalid rectangle dimensions. Aborting.")
            return

        # Crop from the original image (full resolution)
        cropped = orig_image.crop((x1, y1, x2, y2))

        # Resize using LANCZOS resampling
        try:
            resample_method = Image.Resampling.LANCZOS
        except AttributeError:
            resample_method = Image.LANCZOS
        cropped_resized = cropped.resize((FINAL_W, FINAL_H), resample=resample_method)

        # Save in an "images" subfolder next to the original file
        dir_path = os.path.dirname(os.path.abspath(file_path))
        save_dir = os.path.join(dir_path, "images")
        os.makedirs(save_dir, exist_ok=True)

        base_name = os.path.basename(file_path)
        name, ext = os.path.splitext(base_name)
        save_path = os.path.join(save_dir, f"{name}_cropped{ext}")

        cropped_resized.save(save_path)
        print("Cropped image saved to:", save_path)

    save_btn = tk.Button(root, text="Save Crop", command=save_crop)
    save_btn.pack(side=tk.TOP, pady=5)

    root.mainloop()

if __name__ == "__main__":
    main()
