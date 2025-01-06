import { useContext } from "react";
import { SessionContext } from "../SessionProvider";

export function Post(props) {
    const { currentUser } = useContext(SessionContext);
    return (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">by {props.post.userName}</h3>
            <p className="text-gray-700">{props.post.content}</p>
            {currentUser.id === props.post.userId && (
                <button
                    onClick={() => props.onDelete(props.post.id)}
                    className="bg-grey-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors duration-300 ease-in-out shadow-sm">
                    🗑️ 削除
                </button>

            )}
        </div>
    );
}