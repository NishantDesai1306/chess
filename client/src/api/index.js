import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_BE_URL,
});

export const getAnalysis = async (fen) => {
  try {
    const res = await axiosClient.get("/analysis", {
      params: {
        fen,
      },
    });

    return res.data;
  }
  catch (e) {
    console.log(e);
  }
};
