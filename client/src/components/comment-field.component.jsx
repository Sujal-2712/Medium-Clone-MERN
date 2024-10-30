
import React, { useContext, useState } from 'react'
import toast from 'react-hot-toast';
import { UserContext } from '../App';
import axios from 'axios';
import { API_URL } from '../../config';
import { BlogContext } from '../pages/blog.page';

const CommentsField = ({ action }) => {
    const [comment, setComment] = useState("");
    const { userAuth: { access_token, username, fullname, profile_img } } = useContext(UserContext);
    const { blog, setBlog, blog: _id, author: { _id: blog_author }, comments, activity, activity: { total_comments, total_parent_comments }, setTotalParentCommentsLoaded } = useContext(BlogContext);
    const handleComment = async () => {
        if (!access_token) {
            return toast.error("Please login to comment..");
        }
        if (!comment.length) return toast.error("Write something to leave a comment..");

        try {
            const result = await axios.post(`${API_URL}/add-comment`, {
                _id, blog_author, comment
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            setComment("");
            result.data.commented_by = {
                personal_info: {
                    username, profile_img, fullname
                }
            }
            let newCommentArr;
            data.childrenLevel = 0;
            newCommentArr = [data];
            let parentCommentIncrementVal = 1;

            setBlog({ ...blog, comments: { ...comments, results: newCommentArr }, activity: { ...activity, total_comments: total_comments + 1, total_parent_comments: total_parent_comments + parentCommentIncrementVal } });

            setTotalParentCommentsLoaded(preVal => preVal + parentCommentIncrementVal);

        } catch (error) {
            console.log(error);
        }

    }
    return (
        <div>
            <textarea onChange={(e) => {
                setComment(e.target.value)
            }} value={comment} placeholder='Leave a comment...' id="" className='input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto'></textarea>

            <button className='btn-dark mt-5 px-10' onClick={handleComment}>{action}</button>
        </div>
    )
}

export default CommentsField
