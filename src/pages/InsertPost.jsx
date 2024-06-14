import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

const InsertPost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get("type"); // type을 받아옴
  const { state } = location;

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      alert("로그인 회원만 이용할 수 있습니다");
      navigate(`/login`);
    }
  }, [navigate]);

  const [recipient, setRecipient] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [recipientExists, setRecipientExists] = useState(true);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const checkRecipientExists = async (recipient) => {
    const myName = localStorage.getItem("nickname");
    if (!recipient.trim()) {
      setRecipientExists(false);
      return;
    } else if (myName === recipient) {
      // 나에게 전송
      setRecipientExists(false);
      return;
    }

    try {
      const data = {
        nickname: recipient,
      };
      const res = await axios.post(`${process.env.REACT_APP_API_SERVER}/auth/checkName`, data);

      if (!res.data.result) {
        // false = 존재하는 회원임
        setRecipientExists(true);
      } else {
        // 존재하지 않는 회원임
        setRecipientExists(false);
      }
    } catch (error) {
      console.error("수신자 확인 중 오류 발생:", error);
      setRecipientExists(false);
    }
  };

  const handleRecipientBlur = (e) => {
    const value = e.target.value;
    checkRecipientExists(value);
  };

  const getCurrentDateTime = () => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const handleSubmit = async () => {
    if (!recipientExists) {
      alert("존재하지 않는 수신자입니다. 닉네임을 다시 확인해 주세요.");
      return;
    }

    if (!title.trim() || !content.trim() || !recipient.trim()) {
      alert("수신인, 제목과 내용을 모두 입력해 주세요.");
      return;
    }

    const formData = new FormData();
    const currentDateTime = getCurrentDateTime();

    const dto = {
      recipient,
      title,
      content,
      date: currentDateTime,
    };

    formData.append(
      "dto",
      new Blob([JSON.stringify(dto)], {
        type: "application/json",
      })
    );

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const storedToken = localStorage.getItem("token");
      const res = await axios({
        method: "post",
        url: `${process.env.REACT_APP_API_SERVER}/insertPost`,
        data: formData,
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.result) {
        alert("쪽지 작성이 완료되었습니다");
        navigate("/?page=1");
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        // localStorage.clear();
        // alert("로그인이 만료되었습니다");
        // navigate("/");
        // window.location.reload();
        console.error("쪽지 작성 중 오류 발생:", error);
        alert("쪽지 작성 중 오류가 발생했습니다.");
      } else {
        console.error("쪽지 작성 중 오류 발생:", error);
        alert("쪽지 작성 중 오류가 발생했습니다.");
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <>
      <Header />
      <div className="InsertBoard">
        <div className="insertBoardBox">
          <h3>쪽지 작성</h3>
          <div className="boardBox">
            <div className="recipientBox">
              <div className="recipient ten">수신인</div>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onBlur={handleRecipientBlur}
                placeholder="수신자 닉네임을 입력해주세요..."
                className="recipientInput"
              />
              {!recipientExists && <div className="error">! 쪽지 전송이 불가능한 회원입니다.</div>}
            </div>
            <div className="titleBox">
              <div className="title ten">글제목</div>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="fileBox">
              <div className="file ten">첨부파일</div>
              <input type="file" className="input" multiple onChange={handleFileChange} />
            </div>
            <div className="contentBox">
              <div className="content ten">글내용</div>
              <textarea
                className="input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
            </div>
          </div>
          <div className="btnBox">
            <div onClick={handleSubmit}>작성</div>
            <div onClick={handleCancel}>취소</div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default InsertPost;