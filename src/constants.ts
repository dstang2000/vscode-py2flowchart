const pageHtml = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>py2flowchart</title>
        <script src="http://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js"></script>
        <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
		<script src="https://cdn.bootcdn.net/ajax/libs/flowchart/1.14.0/flowchart.min.js"></script>
    </head>
    <body>
        <div id="canvas"></div>
		<pre id="code"></pre>
		<script>
			code= \`{flowchartcode}\`;
			chart = flowchart.parse(code);
			chart.drawSVG('canvas', {{flowchartstyle}});
			$("#code").html(code);
		</script>
    </body>
</html>
`;

const defaultStyle = {
    "line-width": 1,
    "line-color": "black",
    "element-color": "black",
    "fill": "white",
    "font-color": "black",
    "font-size": 14,
    "arrow-end": "open",
    "flowstate": {
        "past": {
            "fill": "#CCFFCC",
            "font-size": 12
        }
    }
};

const defaultStyleForDark = {
    "line-width": 1,
    "line-color": "white",
    "element-color": "white",
    "fill": "white",
    "font-color": "black",
    "font-size": 14,
    "arrow-end": "open",
    "flowstate": {
        "past": {
            "fill": "#CCFFCC",
            "font-size": 12
        }
    }
};

function getPageHtml(){
    return pageHtml;
};
function getDefaultStyle(){
    return defaultStyle;
}
function getDefaultStyleForDark(){
    return defaultStyleForDark;
}
export {getPageHtml, getDefaultStyle, getDefaultStyleForDark};