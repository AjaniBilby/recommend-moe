import { shell } from "~/routes/$.tsx";

export async function loader() {
	return shell(<div>hi2</div>, { title: "Test" });
}