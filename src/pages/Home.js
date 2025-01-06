import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { Post } from "../components/Post";
import { SideMenu } from "../components/SideMenu";
import { supabase } from "../lib/supabase";
import { authRepository } from "../repositories/auth";
import { postRepository } from "../repositories/post";
import { SessionContext } from "../SessionProvider";


const limit = 5;

function Home() {
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null); // 画像・動画ファイル
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const { currentUser, setCurrentUser } = useContext(SessionContext);

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (searchQuery === '') {
            setFilteredPosts(posts);
        } else {
            const filtered = posts.filter(
                (post) =>
                    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.userName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredPosts(filtered);
        }
    }, [searchQuery, posts]);

    const fetchPosts = async (page) => {
        const posts = await postRepository.find(page, limit);
        setPosts(posts);
        setFilteredPosts(posts);
    };

    const moveToNext = async () => {
        const nextPage = page + 1;
        fetchPosts(nextPage);
        setPage(nextPage);
    };

    const moveToPrev = async () => {
        const prevPage = page - 1;
        fetchPosts(prevPage);
        setPage(prevPage);
    };

    const deletePost = async (postId) => {
        await postRepository.delete(postId);
        setPosts(posts.filter((post) => post.id !== postId));
    };

    const signout = async () => {
        await authRepository.signout();
        setCurrentUser(null);
    };

    const uploadFile = async () => {
        if (file) {
            const { data, error } = await supabase.storage
                .from("sns-buketu") // ストレージのバケット名
                .upload(`${currentUser.id}/${file.name}`, file, {
                    cacheControl: "3600",
                    upsert: false,
                });
            if (error) throw error;
            return data.path;
        }
        return null;
    };

    const createPost = async () => {
        const filePath = await uploadFile();
        const post = await postRepository.create(content, currentUser.id, filePath);
        setPosts([
            { ...post, userId: currentUser.id, userName: currentUser.userName },
            ...posts,
        ]);
        setContent('');
        setFile(null);
    };

    const handleLike = async (postId) => {
        await postRepository.like(postId);
        const updatedPosts = posts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
        );
        setPosts(updatedPosts);
    };

    const addComment = async (postId, comment) => {
        await postRepository.addComment(postId, comment, currentUser.id);
        fetchPosts(page); // コメント後にリロード
    };

    if (currentUser == null) return <Navigate replace to="/signin" />;

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-[#34D399] p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">SNS APP</h1>
                    <button onClick={signout} className="text-white hover:text-red-600">ログアウト</button>
                </div>
            </header>
            <div className="container mx-auto mt-6 p-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        {/* 投稿作成エリア */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <textarea
                                className="w-full p-2 mb-4 border-2 border-gray-200 rounded-md"
                                placeholder="What's on your mind?"
                                onChange={(e) => setContent(e.target.value)}
                                value={content}
                            />

                            <button className="bg-[#34D399] text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={createPost}
                                disabled={content === '' && !file}>
                                Post
                            </button>
                        </div>

                        {/* 検索バー */}
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="検索 (投稿内容やユーザー名で検索)"
                                className="w-full p-2 border-2 border-gray-200 rounded-md mb-4"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* 投稿リスト */}
                        <div>
                            {filteredPosts.map((post) => (
                                <Post
                                    key={post.id}
                                    post={post}
                                    onDelete={deletePost}
                                    onLike={handleLike}
                                    onAddComment={addComment}
                                />
                            ))}
                        </div>

                        <Pagination
                            onPrev={page > 1 ? moveToPrev : null}
                            onNext={posts.length >= limit ? moveToNext : null}
                        />
                    </div>
                    <SideMenu />
                </div>
            </div>
        </div>
    );
}

export default Home;
