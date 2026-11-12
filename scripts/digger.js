
// field(x,y) or field(x,y,null) takes x,y as input and returns:
// null for out of boundd
// or a value corresponding to the following bitmask.
const MINE  = 0b0010000;
const DUG   = 0b0100000;
const FLAG  = 0b1000000;
const COUNT = 0b0001111; // first 4 bits are the count of neighbors if dug.
// field(x,y, number) sets that position to the number.

function fieldOn2dArray(a, width, height, x0=0, y0=0) {
	if (a == null) { a = []; }
	if (a.length == 0) {
		for (var i = 0; i < width; i += 1) {
			a.push(Array(height).fill(0));
		}
	}
	return (x,y, set=null)=>{
		if (
			x < x0
			|| y < y0
			|| x >= x0 + width
			|| y >= y0 + height
		) { return null; }

		if (set == null) { return a[x0+x][y0+y]; }
		a[x0+x][y0+y] = set;
		return set;
	}
}

///////

const nigh = [
	[ 0,-1],
	[ 0, 1],
	[ 1,-1],
	[ 1, 0],
	[ 1, 1],
	[-1,-1],
	[-1, 0],
	[-1, 1],
];

function flag(field, x,y) {
	if (field(x,y) & DUG) return 0;
	field(x,y, field(x,y) ^ FLAG);
}

function countNeighbors(field, x,y, mask) {
	var n = 0;
	var m = 0;
	for (var i = 0; i < 8; i += 1) {
		m = field(x+nigh[i][0], y+nigh[i][1]);
		if (m == null) continue;
		if (m & mask) { n += 1; }
	}
	return n;
}

///////

function randomSquare(w,h) {
	var r = Math.random(); // 0 <= r < 1
	return [Math.floor(r * w * h) % w, Math.floor(r * h)];
}

function layMines(field, w,h,m, x,y,s=1) { // width, height, mineCount, fistTap, safety
	if (m > w*h / 4) { throw new Error("this could take forever"); }
	if (x < 0 || x >= w || y < 0 || y >= h) { throw new Error("out of bounds"); }

	function layMine(p,q) {
		if (
			(x - s <= p && p <= x + s)
			&& (y - s <= q && q <= y + s)
		) { return 1; }

		if(field(p,q) & MINE) {
			return 1;
		}

		field(p,q, MINE);

		return 0;
	}

	for (var i = 0; i < m; i+= 1) {
		i -= layMine(...randomSquare(w,h));
	}

}


function dig(field,x,y) {
	const here = field(x,y);
	if (here == null) { return [0,0]; }

	if (here & DUG) {
		const mines = here & COUNT;
		if (mines < 0 || mines > 8) { throw new Error("impossible count"); }
		const flags = countNeighbors(field,x,y,FLAG);
		if (flags < mines) { return [0,0]; }
		var dug,hit
		var totalDug = 0;
		var totalHit = 0;
		for (var i = 0; i < 8; i += 1) {
			[dug,hit] = dig_recursive(field, x+nigh[i][0], y+nigh[i][1]);
			totalDug += dug;
			totalHit += hit;
		}
		return [totalDug, totalHit];
	}

	return dig_recursive(field,x,y, true);
}

function dig_recursive(field,x,y, ignoreFlag=false) {
	var here = field(x,y);
	if (
		(here == null)
		|| ((here & FLAG) && !ignoreFlag)
		|| (here & DUG)
	) { return [0,0]; }

	here = here | DUG;
	here = here & (~FLAG); // have to unset or countflags fails
	field(x,y, here);

	const mines = countNeighbors(field,x,y, MINE);
	if (mines < 0 || mines > 8) { throw new Error("impossible neighbor count"); }
	field(x,y, here | mines);

	if (here & MINE) { return [1, 1]; }

	var totalDug = 1;
	if (mines == 0) {
		var dug,hit;
		for (var i = 0; i < 8; i += 1) {
			[dug,hit] = dig_recursive(field, x+nigh[i][0], y+nigh[i][1]);
			totalDug += dug;
			if (hit) { throw new Error("impossible hit"); }
		}
	}
	return [totalDug, 0];
}


/*
	var here = field(x,y);
	if (
		(here == null)
		|| ((here & FLAG) && !ignoreFlag)
		|| ((here & DUG) && preventDug)
	) { return null; }

	if( here & DUG ) {
		const mines = here & COUNT;
		if (mines < 0 || mines > 8) { throw new Error("impossible count"); }
		const flags = countNeighbors(field,x,y,FLAG);
		console.log("flags, mines: ", flags,mines);
		if (flags < mines) { return null; }
		var hit = false;
		for (var i = 0; i < 8; i += 1) {
			if (dig_recursive(field, x+nigh[i][0], y+nigh[i][1])) {
				hit  = true;
			}
		}
		if (hit) { return 1; }
	}

	here = here | DUG;
	here = here & (~FLAG); // have to unset or countflags fails
	field(x,y, here);

	if (here & MINE) { return 1; }

	const n = countNeighbors(field,x,y, MINE);
	if (n < 0 || n > 8) { throw new Error("impossible neighbor count"); }
	field(x,y, here | n);
	if (n == 0) {
		for (var i = 0; i < 8; i += 1) {
			dig_recursive(field, x+nigh[i][0], y+nigh[i][1], false, true);
		}
	}

	return 0;
}
*/
