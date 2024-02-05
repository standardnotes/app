module.exports = ({ htmlWebpackPlugin }) => {
  return `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8" />
		<meta content="IE=edge" http-equiv="X-UA-Compatible" />
		<meta content="viewport-fit=cover, width=device-width, initial-scale=1" name="viewport" />
		<meta name="theme-color" content="#ffffff" />
		<title>Standard Notes</title>
		<script src="./globals.js"></script>
		${htmlWebpackPlugin.tags.headTags}
		<link rel="stylesheet" href="./style.css" />
	</head>
	<body></body>
	</html>`
}
