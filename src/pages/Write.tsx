import Header from "@/components/Header";
import WriteForm from "../components/write/WriteForm";
import { useEffect } from "react";
import ImageCompressAndUpload from "@/components/ImageCompUpload";
import ImageStore from "@/components/ImageStore";

export default function Write() {
  useEffect(() => {
    document.title = "Write - Shivam Blog";
  }, []);

  return (
    <>
      <Header />
      <section className=" mx-auto grid grid-cols-1 md:grid-cols-10 max-w-7xl w-full">
        <div className="col-span-1 md:col-span-6 p-4 md:px-5 py-4 space-y-4 w-full ">
          <h1 className="text-2xl font-bold">Create a New Post</h1>
          <WriteForm mode="create"/>
        </div>
        <div className="col-span-1 md:col-span-4 w-full space-y-4 px-4 pt-4 pb-16">
          <ImageCompressAndUpload />
          <ImageStore />
        </div>
      </section>
    </>
  );
}
