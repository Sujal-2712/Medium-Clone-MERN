import axios from "axios";
import { API_URL } from "../../config";

const filterPaginationData = async ({ create_new_arr = false, state, data, page, countRoute, data_to_send = {} }) => {
    let obj;
    if (state != null && !create_new_arr) {
        obj = { ...state, results: [...state.results, ...data], page: page };
    } else {
        await axios.post(`${API_URL}` + countRoute, data_to_send).then(({ data: { totalDocs } }) => {
            obj = { results: data, page: 1, totalDocs };
        }).catch((err) => {
            console.log(err);
        })
    }

    return obj;
}
export default filterPaginationData;