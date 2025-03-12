import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { storage } from "@/firebaseConfig";
import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { ToastAction } from "./ui/toast";

export default function ImageCompressAndUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(
    null
  );
  const [compressedResolution, setCompressedResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const [options, setOptions] = useState({
    maxSizeMB: 1,
    maxWidthOrHeight: 1280, 
    preserveExif: false, 
    fileType: "image/webp", 
    initialQuality: 0.6, 
  });

  const maxSizeMBRef = useRef<HTMLInputElement>(null);
  const maxWidthOrHeightRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressedImageUrl, setCompressedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const handleImageChange = (file: File) => {
    setCompressedImage(null);
    setImage(file);
    setCompressedImage(null);
    setCompressedResolution(null);
    setProgress(0);

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        img.src = event.target.result as string;
        img.onload = () => {
          setImageResolution({ width: img.width, height: img.height });
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleImageChange(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const clearInput = () => {
    setImage(null);
    setCompressedImage(null);
    setImageResolution(null);
    setCompressedResolution(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCompress = async () => {
    if (!image) return;

    const compressionOptions = {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: true,
      maxIteration: 10,
      initialQuality: options.initialQuality,
      exifOrientation: options.preserveExif ? undefined : 1,
      fileType: options.fileType,
    };

    try {
      const compressedFile = await imageCompression(image, {
        ...compressionOptions,
        onProgress: (progress) => {
          setProgress(progress);
        },
      });

      const newFileName = image.name.replace(/\.[^/.]+$/, `.${options.fileType.split("/")[1]}`);
      const newFile = new File([compressedFile], newFileName, { type: options.fileType });

      setCompressedImage(newFile);
      const compressedImageUrl = URL.createObjectURL(newFile);
      setCompressedImageUrl(compressedImageUrl);

      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          img.src = event.target.result as string;
          img.onload = () => {
            setCompressedResolution({ width: img.width, height: img.height });
          };
        }
      };
      reader.readAsDataURL(newFile);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveToDevice = () => {
    if (!compressedImage) return;

    const url = URL.createObjectURL(compressedImage);
    const a = document.createElement("a");
    a.href = url;
    a.download = compressedImage.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageUploadToFirestore = async () => {
    setIsUploading(true);
    if (!compressedImage && !image) return;

    const fileToUpload = compressedImage || image;
    if (!fileToUpload) return;

    const storageRef = ref(storage, `images/${fileToUpload.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setDownloadURL(downloadURL);
      toast({
        title: "Image uploaded successfully",
        description: "Image Uploaded at " + downloadURL,
        action: <ToastAction altText="Goto schedule to undo">Copy</ToastAction>,
      });
    } catch (error) {
      console.error(error);
    }
    setIsUploading(false);
  };

  return (
    <section className="rounded-md bg-slate-100 border-2 border-slate-300 p-3 w-full">
      <h1 className="text-2xl font-bold">Compress Image & Upload</h1>
      <div className="pt-4 w-full">
        <div
          {...getRootProps()}
          className="aspect-video rounded-md w-full mx-auto border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer"
          style={{ minHeight: "200px" }}
        >
          <input {...getInputProps()} />
          {image ? (
            <img
              src={compressedImageUrl || URL.createObjectURL(image)}
              alt="Selected"
              className="aspect-video w-full rounded-md object-cover"
            />
          ) : (
            <p className="text-center text-gray-500">
              Drag & drop an image here, or click to select one
            </p>
          )}
        </div>
      </div>
      <div className="pt-4 space-y-4">
        <div className="w-full flex items-center gap-2 justify-between">
          {image && (
            <>
              <div className="w-full space-y-2">
                <p className="bg-white border-2 border-slate-300 px-2 py-1 rounded-md w-full">
                  {image.name}
                </p>
                <div className="flex gap-4">
                  <p className="px-2 py-1 rounded-md border-2 overflow-auto bg-white border-slate-300">
                    {formatFileSize(image.size)}
                  </p>
                  {imageResolution && (
                    <p className="px-2 py-1 rounded-md border-2 overflow-auto bg-white border-slate-300">
                      {imageResolution.width} x {imageResolution.height}
                    </p>
                  )}
                  <Button
                    size={"sm"}
                    variant={"ghost"}
                    className="text-red-600"
                    onClick={clearInput}
                  >
                    <IoClose />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-4 justify-center items-center w-full">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700">Max Size (MB)</label>
            <Input
              type="number"
              step="0.1"
              defaultValue={options.maxSizeMB}
              ref={maxSizeMBRef}
              className="mt-1"
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, maxSizeMB: parseFloat(e.target.value) }))
              }
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700">Max Width/Height</label>
            <Input
              type="number"
              defaultValue={options.maxWidthOrHeight}
              ref={maxWidthOrHeightRef}
              className="mt-1"
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, maxWidthOrHeight: parseInt(e.target.value, 10) }))
              }
            />
          </div>
        </div>
        <div className="pb-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Initial Quality - {Number([options.initialQuality]) * 100} %
          </label>
          <Slider
            value={[options.initialQuality]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={(value) => setOptions((prev) => ({ ...prev, initialQuality: value[0] }))}
            className="mt-1"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex gap-2 items-center justify-between w-full bg-white border px-3 rounded-md">
            <label className="block text-sm font-medium text-gray-700">Preserve EXIF</label>
            <Switch
              checked={options.preserveExif}
              onCheckedChange={() =>
                setOptions((prev) => ({ ...prev, preserveExif: !prev.preserveExif }))
              }
              className="mt-1"
            />
          </div>
          <div className="w-full">
            <Select
              value={options.fileType}
              onValueChange={(value) => setOptions((prev) => ({ ...prev, fileType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/bmp">BMP</SelectItem>
                <SelectItem value="image/jpg">JPG</SelectItem>
                <SelectItem value="image/webp">WEBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 pt-2">
          <Button className="w-full" onClick={handleCompress}>
            Compress Image
          </Button>
          <Button className="w-full" onClick={handleSaveToDevice} disabled={!compressedImage}>
            Save To Device
          </Button>
        </div>

        {progress > 0 && progress < 100 ? (
          <Progress value={progress} />
        ) : (
          compressedImage && (
            <div>
              <div className="space-y-2">
                <p className="px-2 py-1 rounded-md border-2 overflow-auto bg-white border-slate-300">
                  Compressed File Size: {formatFileSize(compressedImage.size)}
                </p>
                {compressedResolution && (
                  <p className="px-2 py-1 rounded-md border-2 overflow-auto bg-white border-slate-300">
                    {compressedResolution.width} x {compressedResolution.height}
                  </p>
                )}
              </div>
            </div>
          )
        )}

        {image || compressedImage ? (
          <div className="w-full">
            <Button
              className="w-full"
              disabled={isUploading}
              onClick={handleImageUploadToFirestore}
            >
              {isUploading && <AiOutlineLoading3Quarters className="size-4 mr-2 animate-spin" />}
              Upload To FireStore
            </Button>
          </div>
        ) : null}
        {downloadURL && (
          <div className="flex items-center gap-3 w-full justify-between">
            <Input
              value={downloadURL}
              disabled
              className="flex flex-wrap disabled:text-slate-900 disabled:opacity-100"
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(downloadURL);
                toast({
                  title: "Copied to clipboard",
                  description: "URL copied to clipboard",
                });
              }}
            >
              Copy
            </Button>
            <Button
              className="text-red-600"
              variant={"ghost"}
              size={"icon"}
              onClick={() => {
                setDownloadURL(null);
              }}
            >
              <IoClose />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
