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
    <script src="./addDeviceToWindow.js"></script>
		${htmlWebpackPlugin.tags.headTags}
		<style>
			html,
			body {
				min-width: 350px;
				max-width: 350px;
				min-height: 260px;
			}
		</style>
	</head>
	<body></body>
	</html>`
}
