import { useState, useEffect } from "react";
import axios from "axios";

const useLatestPosts = () => {
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const { data } = await axios.get("/posts-page/1");
        setLatestPosts(data);
      } catch (err) {
        console.log(err);
      }
    };

    getPosts();
  }, []);

  return {
    latestPosts,
  };
};

export default useLatestPosts;