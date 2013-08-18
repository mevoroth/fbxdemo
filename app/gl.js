define(function() {
	var Gl = function(id)
	{
		var canvas = document.getElementById(id);
		this._gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		if (!this._gl)
		{
			alert("NO GL SUPPORT");
			return;
		}
		
		this._width = $("#" + id).attr("width");
		this._height = $("#" + id).attr("height");

		this._shaderPrgm = this._gl.createProgram();
		
		this._glBuffers = [];
		this._shaderInputs = [];
		this._shaderInputsSize = [];
		this._dataBuffers = [];
		//this._vBuffer = this._gl.createBuffer();
		//this._vertexPositionAttribute = null;
		
		// Vertexes Index
		this._iBuffer = null;
		this._polygons = null;
		
		// Settings
		this._gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this._gl.clearDepth(1.0);
		this._gl.enable(this._gl.DEPTH_TEST);
		this._gl.depthFunc(this._gl.LEQUAL);
	};

	Gl.prototype.createShader = function(type, src)
	{
		var shader = this._gl.createShader(type);
		this._gl.shaderSource(shader, src);
		this._gl.compileShader(shader);
		
		if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS))
		{
			console.log(type);
			console.log(this._gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	};

	Gl.prototype.useProgram = function()
	{
		this._gl.linkProgram(this._shaderPrgm);
		
		if (!this._gl.getProgramParameter(this._shaderPrgm, this._gl.LINK_STATUS)) {
			alert("Failed to initialize shaders");
			return;
		}
		
		this._gl.useProgram(this._shaderPrgm);
	};

	Gl.prototype.attachShader = function(shader)
	{
		this._gl.attachShader(this._shaderPrgm, shader);
	};

	Gl.prototype.FRAGMENT_SHADER = function()
	{
		return this._gl.FRAGMENT_SHADER;
	};

	Gl.prototype.VERTEX_SHADER = function()
	{
		return this._gl.VERTEX_SHADER;
	};

	/**
	 * @deprecated
	 */
	Gl.prototype.getGl = function()
	{
		return this;
	};

	Gl.prototype.test = function()
	{
		console.log(this);
	};

	Gl.prototype.initBuffer = function()
	{
		//this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vBuffer);

		for (var k in this._glBuffers)
		{
			this._gl.bindBuffer(
				this._gl.ARRAY_BUFFER,
				this._glBuffers[k]
			);
			this._gl.bufferData(
				this._gl.ARRAY_BUFFER,
				new Float32Array(this._dataBuffers[k]),
				this._gl.STATIC_DRAW
			);
		}

		// var vertices = /*[
		// 	1.0,  1.0,  0.5,
		// 	-1.0, 1.0,  0.5,
		// 	1.0,  -1.0, 0.5,
		// 	-1.0, -1.0, 0.5
		// ]*/
		// POLYBITCH.controlPoints;
		// this._gl.bufferData(
		// 	this._gl.ARRAY_BUFFER,
		// 	new Float32Array(vertices),
		// 	this._gl.STATIC_DRAW
		// );
		// this._gl.bufferData(
		// 	this._gl.ELEMENT_ARRAY_BUFFER,
		// 	new Uint16Array(POLYBITCH.polygons),
		// 	this._gl.STATIC_DRAW
		// );
		
		if (this._iBuffer !== null)
		{
			// Polygons by index
			this._gl.bindBuffer(
				this._gl.ELEMENT_ARRAY_BUFFER,
				this._iBuffer
			);
			// @TODO : A MODIFIER
			this._gl.bufferData(
				this._gl.ELEMENT_ARRAY_BUFFER,
				new Uint16Array(this._polygons),
				this._gl.STATIC_DRAW
			);
		}
	};

	Gl.prototype.draw = function()
	{
		this._gl.clear(
			this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT
		);
		
		// Camera
		var persp = makePerspective(45, this._width/this._height, 0.1, 500.0);
		var mat = Matrix.I(4);
		mat = mat.x(
			Matrix.Translation($V([0, -50, -300])).ensure4x4()
		);

		// Load buffer
		for (var k in this._glBuffers)
		{
			this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._glBuffers[k]);
			this._gl.vertexAttribPointer(this._shaderInputs[k], this._shaderInputsSize[k], this._gl.FLOAT, false, 0, 0);
		}

		// this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vBuffer);
		// this._gl.vertexAttribPointer(this._vertexPositionAttribute, 3, this._gl.FLOAT, false, 0, 0);

		// // SET TEXTURE
		// this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._tBuffer);
		// this._gl.vertexAttribPointer(this._textureCoordAttribute, 2, this._gl.FLOAT, false, 0, 0);

		//console.log(this._texture);
		this._gl.activeTexture(this._gl.TEXTURE0);
		this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
		this._gl.uniform1i(this._gl.getUniformLocation(this._shaderPrgm, "uSampler"), 0);
		
		// Set matrix uniforms
		var pUniform = this._gl.getUniformLocation(this._shaderPrgm, "uPMatrix");
		this._gl.uniformMatrix4fv(pUniform, false, new Float32Array(persp.flatten()));

		var mvUniform = this._gl.getUniformLocation(this._shaderPrgm, "uMVMatrix");
		this._gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mat.flatten()));
		
		// @TODO CHANGER
		this._gl.drawElements(this._gl.TRIANGLES, this._polygons.length, this._gl.UNSIGNED_SHORT, 0);
	};

	Gl.prototype.enableVertexAttribArray = function(varname, dataBuffer, size)
	{
		this._dataBuffers[varname] = dataBuffer;
		this._shaderInputsSize[varname] = size;
		this._glBuffers[varname] = this._gl.createBuffer();
		this._shaderInputs[varname] = this._gl.getAttribLocation(
			this._shaderPrgm,
			varname
		);
		this._gl.enableVertexAttribArray(this._shaderInputs[varname]);
		// this._vertexPositionAttribute = this._gl.getAttribLocation(
		// 	this._shaderPrgm,
		// 	varname
		// );
		// this._gl.enableVertexAttribArray(this._vertexPositionAttribute);
	};

	Gl.prototype.enableVertexIndex = function(polygons)
	{
		this._iBuffer = this._gl.createBuffer();
		this._polygons = polygons;
	};

	Gl.prototype.loadTexture = function(src)
	{
		var self = this;
		var texture = this._gl.createTexture();
		var img = new Image();
		img.onload = function()
		{
			self._loadTexture(img, texture);
		};
		img.src = src;
		this._texture = texture;
	};

	Gl.prototype._loadTexture = function(img, tex)
	{
		this._gl.bindTexture(this._gl.TEXTURE_2D, tex);
		this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, img);
		this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
		this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_NEAREST);
		this._gl.generateMipmap(this._gl.TEXTURE_2D);
		this._gl.bindTexture(this._gl.TEXTURE_2D, null);
	};
	return Gl;
});
