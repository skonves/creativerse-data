const fs = require('fs')
const path = require('path')

const dir = path.join(process.cwd(), 'data')

findInFiles(dir, '.json');

// searchs all game files and exports embeded files
function findAndSaveFile(searchFolder, outFolder, queryString) {
	const query = Buffer.from(queryString, 'utf8')
	fs.readdir(searchFolder, (err, filenames) => {
		filenames.forEach(filename => {
			fs.readFile(path.join(searchFolder, filename), (err, data) => {
				if (!err && data.includes(query)) {
					for (let i = data.indexOf(query); ~i; i = data.indexOf(query, i + 1)) {
						const f = extractFile(data, i + query.length);

						fs.writeFile(path.join(outFolder, f.name), f.body, err => {
							if (err) {
								console.log(err)
							}
						})
					}
				}
			})
		})
	})
}

// searchs all game files and exports embeded files
function findInFiles(searchFolder, queryString) {
	const query = Buffer.from(queryString, 'utf8')
	fs.readdir(searchFolder, (err, filenames) => {
		filenames.forEach(filename => {
			fs.readFile(path.join(searchFolder, filename), (err, data) => {
				if (!err && data.includes(query)) {
					for (let i = data.indexOf(query); ~i; i = data.indexOf(query, i + 1)) {
						console.log(filename, i)
					}
				}
			})
		})
	})
}

// Extracts an embedded file from a unity .asset file
// index is the index of the END of the file name (eg, indexOf value + query.length)
function extractFile(buffer, index) {
	let extra = (index) % 4
	extra = extra ? 4 - extra : extra

	const lenPtr = index + extra
	const length = toInt(buffer.slice(lenPtr, lenPtr + 4))

	const result = { body: buffer.slice(lenPtr + 4, lenPtr + 4 + length) }

	for (let i = index + extra; i > index - 50; i = i - 4) {
		const potentialLength = toInt(buffer.slice(i, i + 4))
		if (potentialLength == index - i - 4) {
			result.name = buffer.slice(i + 4, i + 4 + potentialLength).toString('utf8')
			return result;
		}
	}
}

function toInt(buffer) {
	return buffer[0] + (buffer[1] << 8) + (buffer[2] << 16) + (buffer[3] << 24)
}


// sharedassets0.assets @ 827360-2905550