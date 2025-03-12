import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { db, storage } from "@/firebaseConfig";
import { contentSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { micromark } from "micromark";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ErrorToast } from "../global/ErrorToast";
import { SuccessToast } from "../global/SuccessToast";
import { Switch } from "../ui/switch";
import EditorComponent from "./EditorComponent";
import { FeaturedImageForm } from "./FeaturedImageForm";

interface EditorComponentHandle {
  getValue: () => string;
  setValue: (value: string) => void;
}

interface WriteFormContent {
  mode: "edit" | "create";
  paramUrl?: string;
}

export default function WriteForm({ mode, paramUrl }: WriteFormContent) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"edit" | "create">(mode);
  const [currentPost, setCurrentPost] = useState<any>(null);

  const editorRef = useRef<EditorComponentHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      featuredImage: "",
      title: "",
      slug: "",
      isPublic: false,
      author: "Shivam Kumar",
      mdxContent: "",
    },
  });

  const generateSlug = () => {
    const title = form.getValues().title.toLowerCase();
    const slug = title.replace(/ /g, "-").replace(/[^a-z0-9\-]/g, "");

    form.setValue("slug", slug);
  };

  const removeLineBreaks = (input: string) => input.replace(/\n/g, "");

  const clearFeaturedImage = () => {
    setFeaturedImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = (url: string) => {
    setFeaturedImage(url);
  };

  const handleImageMount = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFeaturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    setImageUploading(true);
    if (fileInputRef.current && fileInputRef.current.files?.length) {
      const file = fileInputRef.current.files[0] as File;
      const storageRef = ref(storage, `images/${file.name}`);

      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setFeaturedImage(downloadURL);
        form.setValue("featuredImage", downloadURL);
        setSuccess("Image uploaded successfully!");
      } catch (uploadError) {
        setError("Failed to upload image.");
        console.error(uploadError);
      }
    }
    setImageUploading(false);
  };

  useEffect(() => {
    if (formMode === "edit" && paramUrl) {
      setFormMode("edit");
      const fetchPost = async () => {
        try {
          const postMetaDocRef = doc(db, "blogMetaCollection", paramUrl);
          const postMDXContentDocRef = doc(db, "blogMDXContentCollection", paramUrl);

          const [postMetaSnapshot, postMDXContentSnapshot] = await Promise.all([getDoc(postMetaDocRef), getDoc(postMDXContentDocRef)]);

          if (postMetaSnapshot.exists() && postMDXContentSnapshot.exists()) {
            setCurrentPost({ ...postMetaSnapshot.data(), ...postMDXContentSnapshot.data() });
            const postMetaData = postMetaSnapshot.data();
            const postMDXContentData = postMDXContentSnapshot.data();

            form.setValue("title", postMetaData.title);
            form.setValue("slug", postMetaData.slug);
            form.setValue("author", postMetaData.author);
            form.setValue("isPublic", postMetaData.isPublic);
            form.setValue("mdxContent", postMDXContentData.mdxContent);
            editorRef.current?.setValue(postMDXContentData.mdxContent);
            setFeaturedImage(postMetaData.featuredImage);
          } else {
            setError("Post not found.");
          }
        } catch (error) {
          setError("Failed to fetch post.");
          console.error(error);
        }
      };

      fetchPost();
    }
  }, [formMode, paramUrl]);

  const onSubmit = async (values: z.infer<typeof contentSchema>) => {
    setIsSubmitting(true);
  
    const post = {
      title: values.title,
      slug: values.slug,
      author: values.author,
      mdxContent: editorRef.current?.getValue() as string,
      htmlContent: removeLineBreaks(micromark(editorRef.current?.getValue() as string)),
      featuredImage: featuredImage as string,
      isPublic: values.isPublic,
      lastUpdated: new Date(),
    };
  
    const meta = {
      featuredImage: post.featuredImage,
      title: post.title,
      slug: post.slug,
      author: post.author,
      lastUpdated: post.lastUpdated,
      isPublic: post.isPublic,
      isPublished: false,
      publishedDate: null as Date | null,
    };
  
    if (formMode === "create" || (!currentPost.isPublished && post.isPublic)) {
      meta.isPublished = post.isPublic;
      meta.publishedDate = new Date();
    } else if (formMode === "edit" && currentPost.isPublished && post.isPublic) {
      meta.isPublished = true; // Already published, so ensure this is consistent
    }
  
    const contentUpdate = {
      mdxContent: post.mdxContent,
      content: post.htmlContent,
    };
  
    try {
      if (formMode === "create") {
        await setDoc(doc(db, "blogMetaCollection", post.slug), meta);
        await setDoc(doc(db, "blogMDXContentCollection", post.slug), contentUpdate);
        await setDoc(doc(db, "blogContentCollection", post.slug), { content: post.htmlContent });
        await setDoc(doc(db, "blogReadCountCollection", post.slug), { readCount: 0 });
      } else if (formMode === "edit") {
        await updateDoc(doc(db, "blogMetaCollection", post.slug), meta);
        await updateDoc(doc(db, "blogMDXContentCollection", post.slug), contentUpdate);
        await updateDoc(doc(db, "blogContentCollection", post.slug), { content: post.htmlContent });
      }
  
      navigate("/dashboard");
    } catch (error:any) {
      setError(`Error in ${formMode === "create" ? "creating" : "editing"} post: ${error.message}`);
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <>
      <FeaturedImageForm
        fileInputRef={fileInputRef}
        featuredImage={featuredImage}
        isPending={imageUploading}
        isSubmitting={isSubmitting}
        clearFeaturedImage={clearFeaturedImage}
        handleUrlChange={handleUrlChange}
        handleFileUpload={handleFileUpload}
        handleImagemount={handleImageMount}
      />
      <div>
        <ErrorToast message={error} />
        <SuccessToast message={success} />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>*Title of the post</FormLabel>
                <FormControl>
                  <Input placeholder="An awesome title" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>*Slug for the URL</FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    <Input placeholder="slug for the post" {...field} disabled={isSubmitting} />
                    <Button type="button" onClick={generateSlug} disabled={isSubmitting}>
                      Generate
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 h-full py-2">
                <FormControl>
                  <Switch
                    disabled={isSubmitting}
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                    }}
                  />
                </FormControl>
                <FormLabel className="pb-1.5 text-base">Public to users</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of the Author</FormLabel>
                <FormControl>
                  <Input placeholder="Author Name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mdxContent"
            render={() => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <EditorComponent ref={editorRef} initialValue={editorRef.current?.getValue() || ""} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">
            {isSubmitting && <AiOutlineLoading3Quarters className="mx-3 h-4 w-4 animate-spin" />}
            {formMode === "edit" ? "Update" : "Save"}
          </Button>
        </form>
      </Form>
    </>
  );
}
