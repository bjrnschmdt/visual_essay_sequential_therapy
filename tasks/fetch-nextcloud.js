import fs from "fs";
import archieml from "archieml";
import docs from "../nextcloud.config.js";

const CWD = process.cwd();

const fetchNextcloud = async ({ id, gid }) => {
	console.log(`fetching...${id}`);

	const base = "https://cloud.rz.uni-kiel.de";
	const post = `index.php/s/${id}/export?format=txt`;
	const url = `${base}/${post}`;

	try {
		const response = await fetch(url);
		const text = await response.text();
		console.log(text);
		const parsed = archieml.load(text);
		const str = JSON.stringify(parsed);
		return str;
	} catch (err) {
		throw new Error(err);
	}
};

(async () => {
	for (let d of docs) {
		try {
			const str = await fetchNextcloud(d);
			const file = `${CWD}/${d.filepath}`;
			fs.writeFileSync(file, str);
		} catch (err) {
			console.log(err);
		}
	}
})();
