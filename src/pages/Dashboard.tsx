import Header from "@/components/Header";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getAggregateFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  sum,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  author: string;
  slug: string;
  featuredImage: string;
  title: string;
  readCount: number;
  isPublic: boolean;
  publishedDate?: Date;
  lastUpdated: Date;
  isPublished: boolean;
}

// function formatDate(date: Date): string {
//   const options: Intl.DateTimeFormatOptions = {
//     day: "2-digit",
//     month: "long",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   };
//   return new Intl.DateTimeFormat("en-US", options).format(date);
// }

function formatDateShort(date: Date): string {
  const now = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (date.getFullYear() !== now.getFullYear()) {
    return `${day} ${month}, ${year} - ${hours}:${minutes}`;
  } else {
    return `${day} ${month}, ${year} - ${hours}:${minutes}`;
  }
}

export default function Dashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [fetching, setFetching] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>();
  const { toast } = useToast();
  const [totalReads, setTotalReads] = useState(0);

  useEffect(() => {
    const updateTotalReads = async () => {
      const coll = collection(db, "blogReadCountCollection");
      const snapshot = await getAggregateFromServer(coll, {
        totalReadCount: sum("readCount"),
      });
      const receivedTotalReads = snapshot.data().totalReadCount;
      setTotalReads(receivedTotalReads);
    };
    updateTotalReads();
  }, []);

  useEffect(() => {
    document.title = "Dashboard - Shivam Blog";

    const fetchPosts = async () => {
      setFetching(true);

      try {
        const q = query(
          collection(db, "blogMetaCollection"),
          orderBy("lastUpdated", "desc"),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const readCountSnapshot = await getDocs(
          collection(db, "blogReadCountCollection")
        );

        const fetchedPosts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            readCount: readCountSnapshot.docs
              .find((readCountDoc) => doc.id === readCountDoc.id)
              ?.data().readCount,
            ...data,
            publishedDate: data.publishedDate
              ? data.publishedDate.toDate()
              : null,
            lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null,
          };
        }) as BlogPost[];

        setPosts(fetchedPosts);
        setHasMore(fetchedPosts.length === 10);
        setLastDoc(
          fetchedPosts.length > 0
            ? querySnapshot.docs[querySnapshot.docs.length - 1]
            : null
        );
      } catch (error) {
        console.error("Error fetching posts: ", error);
        toast({
          variant: "destructive",
          title: "Error fetching posts",
          description: "There was an error fetching the posts.",
        });
      } finally {
        setFetching(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostPublishToggle = async (
    postId: string,
    currentStatus: boolean,
    isPublished: boolean
  ) => {
    try {
      const postRef = doc(db, "blogMetaCollection", postId);
      const dataToBeUpdated: Partial<BlogPost> = {};

      if (isPublished) {
        dataToBeUpdated.isPublic = !currentStatus;
        dataToBeUpdated.lastUpdated = new Date();
      } else {
        dataToBeUpdated.isPublic = true;
        dataToBeUpdated.isPublished = true;
        dataToBeUpdated.publishedDate = new Date();
        dataToBeUpdated.lastUpdated = new Date();
      }

      // Update the document in Firestore
      await updateDoc(postRef, dataToBeUpdated);

      // Update the state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isPublic: dataToBeUpdated.isPublic ?? post.isPublic,
                publishedDate: isPublished
                  ? dataToBeUpdated.publishedDate || post.publishedDate
                  : post.publishedDate,
                lastUpdated: dataToBeUpdated.lastUpdated || post.lastUpdated,
                isPublished: dataToBeUpdated.isPublished ?? post.isPublished,
              }
            : post
        )
      );

      toast({
        title: `Post is now ${!currentStatus ? "published" : "unpublished"}`,
        description: "Post status has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Error toggling publish status`,
        description: "There was an error updating the post status.",
      });
      console.error("Error toggling publish status:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "blogMetaCollection", postId));
      await deleteDoc(doc(db, "blogContentCollection", postId));
      await deleteDoc(doc(db, "blogReadCountCollection", postId));
      await deleteDoc(doc(db, "blogMDXContentCollection", postId));

      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      toast({
        title: "Post deleted successfully",
        description: "Post has been deleted successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Error deleting post`,
        description: `${error}`,
      });
      console.error("Error deleting post:", error);
    }
  };

  const fetchMorePosts = async () => {
    setFetching(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const fetchMoreQuery = query(
      collection(db, "blogMetaCollection"),
      orderBy("publishedDate", "desc"),
      startAfter(lastDoc),
      limit(15)
    );
    const querySnapshot = await getDocs(fetchMoreQuery);
    const fetchedPosts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      publishedDate: doc.data().publishedDate.toDate(),
    })) as BlogPost[];
    if (querySnapshot.size < 15) {
      setHasMore(false);
    }
    if (querySnapshot.size > 0) {
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
    setPosts((prevPosts) => [...prevPosts, ...fetchedPosts]);
    setFetching(false);
  };

  return (
    <>
      <Header />
      <main className="space-y-4 pt-4">
        <section className="w-full border-2 border-slate-300 max-w-7xl mx-auto rounded-md p-4">
          <div className="flex items-end gap-4">
            <h1 className="text-2xl font-bold">Total Reads:</h1>
            <p className="text-lg font-medium">{totalReads} 🥳 keep going...</p>
          </div>
        </section>
        <section className="max-w-7xl mx-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-16">S. No.</TableHead>
                <TableHead>Title of Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="max-w-16">RC</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Toggle Public</TableHead>
                <TableHead className="text-center">Edit</TableHead>
                <TableHead className="text-center">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post, index) => (
                <TableRow key={post.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <a href={`https://z1shivam.web.app/blogs/${post.slug}`}>
                      {post.title}
                    </a>
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{post.readCount}</TableCell>
                  <TableCell>
                    {post.isPublished
                      ? formatDateShort(post.publishedDate!)
                      : "Not Published"}
                  </TableCell>
                  <TableCell>{formatDateShort(post.lastUpdated)}</TableCell>
                  <TableCell className="p-0">
                    <div className="w-full flex h-full justify-center items-center">
                      <Switch
                        checked={post.isPublic}
                        onCheckedChange={() =>
                          handlePostPublishToggle(
                            post.id,
                            post.isPublic,
                            post.isPublished
                          )
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-0 ">
                    <div className="w-full flex h-full justify-center items-center">
                      <Link
                        to={`/edit/${post.id}`}
                        className="bg-slate-900 px-3 py-2 rounded-md text-white"
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className=" p-0">
                    <div className="w-full flex h-full justify-center items-center">
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <div className="p-3 py-2 bg-red-500 rounded-md text-white">
                            Delete
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This is delete all the post info and the
                              respective content. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              Yes Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={9} className="text-center h-16 p-0">
                  <div className=" w-full h-full flex justify-center items-center py-2">
                    {hasMore ? (
                      <Button onClick={fetchMorePosts} disabled={fetching}>
                        {fetching && (
                          <AiOutlineLoading3Quarters className="size-4 animate-spin mr-2" />
                        )}
                        Load More
                      </Button>
                    ) : (
                      <p>No more posts</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </main>
    </>
  );
}
