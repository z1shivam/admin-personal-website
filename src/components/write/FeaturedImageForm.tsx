import { featuredImageFormSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefObject } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { IoImageOutline } from "react-icons/io5";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface FeaturedImageFormProps {
  fileInputRef: RefObject<HTMLInputElement>;
  featuredImage: string;
  isPending: boolean;
  isSubmitting?: boolean;
  clearFeaturedImage: () => void;
  handleUrlChange: (url: string) => void;
  handleFileUpload: SubmitHandler<z.infer<typeof featuredImageFormSchema>>;
  handleImagemount: () => void;
}

export const ImagePlaceHolder: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center rounded-md border-2 border-gray-300 bg-gray-200">
    <IoImageOutline className="size-12 text-gray-500" />
  </div>
);

export const FeaturedImageForm: React.FC<FeaturedImageFormProps> = ({
  fileInputRef,
  featuredImage,
  isPending,
  isSubmitting,
  clearFeaturedImage,
  handleUrlChange,
  handleFileUpload,
  handleImagemount,
}) => {
  const featuredImageForm = useForm<z.infer<typeof featuredImageFormSchema>>({
    resolver: zodResolver(featuredImageFormSchema),
    defaultValues: {
      featuredImageUrl: featuredImage || "",
    },
  });

  return (
    <Form {...featuredImageForm}>
      <form className="flex w-full justify-between gap-4 pb-4 flex-col md:flex-row " onSubmit={featuredImageForm.handleSubmit(handleFileUpload)}>
        <div className="aspect-video md:w-1/2 rounded-md w-full">
          {featuredImage ? <img src={featuredImage} className="aspect-video w-full rounded-md object-cover" /> : <ImagePlaceHolder />}
        </div>
        <div className="md:w-1/2 space-y-3">
          <FormField
            control={featuredImageForm.control}
            name="featuredImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter the URL of the image.."
                    {...field}
                    disabled={isPending || isSubmitting}
                    value={featuredImage}
                    onChange={(e) => {
                      field.onChange(e);
                      handleUrlChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-center text-sm text-gray-500">or, upload from device</p>
          <input
            type="file"
            accept="image/*"
            name="imageToUpload"
            disabled={isSubmitting}
            onChange={handleImagemount}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed file:disabled:text-gray-300 file:disabled:cursor-not-allowed file:mr-4 file:rounded-md file:border-2 file:border-gray-300 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-indigo-100"
          />
          <div className="flex justify-between gap-4">
            <Button className="flex-grow" type="submit" disabled={isSubmitting}>
              {isPending && <AiOutlineLoading3Quarters className="mx-3 h-4 w-4 animate-spin" />}
              Upload
            </Button>
            <Button variant={"destructive"} className="flex-grow" type="button" onClick={clearFeaturedImage} disabled={isSubmitting}>
              Remove
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};