import fs from "fs";
import archieml from "archieml";
import docs from "../nextcloud.config.js";

const CWD = process.cwd();

const fetchNextcloud = async ({ id, gid }) => {
	console.log(`fetching...${id}`);

	const base = "https://cloud.rz.uni-kiel.de/";
	const post = gid
		? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}`
		: `index.php/s/${id}/download`;
	const url = `${base}/${post}`;

	try {
		const response = await fetch(url);
		const text = await response.text();
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
