import { storage } from "@/firebaseConfig";
import { cn } from "@/lib/utils";
import { getDownloadURL, getMetadata, listAll, ref, deleteObject } from "firebase/storage";
import { useEffect, useState } from "react";
import { IoMdRefresh } from "react-icons/io";
import { Button } from "./ui/button";
import { FaCopy, FaTrash } from "react-icons/fa";
import { toast } from "./ui/use-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Image {
  url: string;
  timeCreated: Date;
  path: string;
}

export default function ImageStore() {
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [imageArray, setImageArray] = useState<Image[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalImages, setTotalImages] = useState(0);
  const [imagesToLoad, setImagesToLoad] = useState(6);

  async function fetchImages() {
    setIsRefreshing(true);
    try {
      const storageRef = ref(storage, "images");
      const result = await listAll(storageRef);

      const imagePromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return { url, timeCreated: new Date(metadata.timeCreated), path: itemRef.fullPath };
      });

      const imageList = await Promise.all(imagePromises);

      const sortedImages = imageList.sort(
        (a, b) => b.timeCreated.getTime() - a.timeCreated.getTime()
      );
      setTotalImages(sortedImages.length);
      setAllImages(sortedImages);
    } catch (error) {
      console.error("Error fetching images: ", error);
    }
    setIsRefreshing(false);
  }

  const mountImages = () => {
    const loadedImages = allImages.slice(0, imagesToLoad);
    setImageArray(loadedImages);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    mountImages();
  }, [imagesToLoad, allImages]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => {
        toast({ title: "Copied to clipboard", description: url.slice(0, 47) + "..." });
      },
      (err) => {
        toast({ title: "Cannot copy to clipboard" });
        console.error("Could not copy text: ", err);
      }
    );
  };

  const deleteImage = async (path: string) => {
    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
      toast({ title: "Image deleted successfully" });

      // Update state after deletion
      setAllImages((prev) => prev.filter((image) => image.path !== path));
      setImageArray((prev) => prev.filter((image) => image.path !== path));
      setTotalImages((prev) => prev - 1);
    } catch (error) {
      toast({ title: "Error deleting image" });
      console.error("Error deleting image: ", error);
    }
  };

  return (
    <section className="rounded-md bg-slate-100 border-2 border-slate-300 p-3 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ImageStore - {totalImages}</h1>
        <Button variant={"ghost"} size={"icon"} onClick={fetchImages}>
          <IoMdRefresh className={cn("size-5", isRefreshing && "animate-spin")} />
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 pt-4">
        {imageArray.map((image, index) => (
          <div key={index} className="relative rounded-md overflow-hidden group">
            <img
              src={image.url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover aspect-video"
            />
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-2 bg-white rounded-full shadow-md"
                onClick={() => copyToClipboard(image.url)}
              >
                <FaCopy className="text-gray-700" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger>
                  <div className="p-2 bg-white rounded-full shadow-md">
                    <FaTrash className="text-red-700" />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the image from the storage. All the content using this image
                      will be broken. Proceed with caution.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteImage(image.path)}
                      className="bg-red-600"
                    >
                      Yes Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full flex items-center justify-center pt-4">
        {totalImages > imageArray.length ? (
          <Button onClick={() => setImagesToLoad((prev) => prev + 10)}>Load 10 More</Button>
        ) : (
          <p>No more images</p>
        )}
      </div>
    </section>
  );
}
