(module
	(import "env" "memory" (memory 0))

	(export "memory/allocate" (func $memory/allocate))
	(func $memory/allocate
		(param $bytes i32)
		(result i32)

		(local $head i32)
		(local $tail i32)

		(local.set $head (i32.load (global.get $ptr/heapTailAddress)))

		;; update heap pointer
		(local.set $tail (i32.add
			(local.get $head )
			(local.get $bytes)
		))
		(i32.store (global.get $ptr/heapTailAddress) (local.get $tail))

		;; ensure linear memory is large enough
		(call $memory/reserve (local.get $tail))

		(return (local.get $head))
	)

	(export "memory/reserve" (func $memory/reserve))
	(func $memory/reserve
		(param $bytes i32)
		(local $pages/required i32)
		(local $pages/current  i32)
		(local $pages/delta    i32)

		(local.set $pages/current (memory.size))

		;; ceil(bytes / 65536) = (bytes + 65535) >> 16
		(local.set $pages/required
			(i32.shr_u
				(i32.add (local.get $bytes) (i32.const 65535))
				(i32.const 16)
			)
		)
		(local.set $pages/delta (i32.sub (local.get $pages/required) (local.get $pages/current)) )

		(if (i32.lt_s (local.get $pages/delta) (i32.const 0))
			(then return)
		)

		(drop (memory.grow (local.get $pages/delta)))
	)




	;; Slice { length: i32, pad: i32, element[] }
	(export "memory/slice/elementAddress" (func $memory/slice/elementAddress))
	(func $memory/slice/elementAddress
		(param $ptr        i32)
		(param $recordSize i32)
		(param $index      i32)
		(result i32)

		(return (i32.add
			(i32.add (local.get $ptr  ) (i32.const 8)) ;; add the slice length offset
			(i32.mul (local.get $index) (local.get $recordSize) )
		))
	)

	(export "memory/slice/length" (func $memory/slice/length))
	(func $memory/slice/length
		(param $ptr i32)
		(result i32)

		(return (i32.load (local.get $ptr)))
	)

	(export "memory/slice/push" (func $memory/slice/push))
	(func $memory/slice/push
		(param $ptr i32)
		(param $recordSize i32)
		(result i32) ;; the address of the new elmement

		(local $length i32)
		(local $addr   i32)

		;; get the address of the next element
		(local.set $length (call $memory/slice/length         (local.get $ptr)                                             ))
		(local.set $addr   (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $length) ))

		;; increase the slice length in-place
		(local.set $length (i32.add (local.get $length) (i32.const 1)))
		(i32.store (local.get $ptr) (local.get $length))
		(call $memory/reserve (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $length) ))

		(return (local.get $addr))
	)

	(export "memory/slice/insert" (func $memory/slice/insert))
	(func $memory/slice/insert
		(param $ptr        i32) ;; first element pointer
		(param $recordSize i32) ;; size of each element
		(param $id         i32) ;; id of new element
		(result            i32) ;; the address of where it exists

		(local $si    i32) ;; start   index
		(local $mi    i32) ;; middle  index
		(local $ei    i32) ;; end     index
		(local $curr  i32) ;; current value
		(local $s_val i32) ;; start   value
		(local $e_val i32) ;; end     value

		;; temp vals
		(local $length  i32)
		(local $addr    i32)

		(local.set $length (call $memory/slice/length (local.get $ptr)))

		;; on zero length, just push
		(if (i32.eq (local.get $length) (i32.const 0)) (then
			(call $memory/slice/push (local.get $ptr) (local.get $recordSize))
			(return (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (i32.const 0) ))
		))

		;; ei = userIDs.length == 0 ? 0 : userIDs.length -1
		(local.set $si (i32.const 0) )
		(local.set $ei (i32.sub (local.get $length) (i32.const 1) ) )
		(block $while_break (loop $while_loop
			;; mi = Math.floor((ei-si) / 2) + si;
			(local.set $mi
				(i32.add
					(i32.div_u
						(i32.sub (local.get $ei) (local.get $si) )
						(i32.const 2)
					)
					(local.get $si)
				)
			)

			;; const curr = userIDs[mi];
			(local.set $addr (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $mi) ))
			(local.set $curr (i32.load (local.get $addr)))

			;; if (curr === userID) return userIDs;
			(if (i32.eq (local.get $curr) (local.get $id))
				(then (return (local.get $addr)))
			)

			(if (i32.lt_u (local.get $curr) (local.get $id))
				(then (local.set $si (local.get $mi))) ;; if (curr < id) si = mi;
				(else (local.set $ei (local.get $mi))) ;; else ei = mi;
			)

			(if (i32.ge_u ;; if (si + 1 >= ei)
				(i32.add (local.get $si) (i32.const 1))
				(local.get $ei)
			) (then
				;; const s_val = userIDs[si];
				(local.set $s_val (i32.load (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $si) )))
				;; if (s_val === id) return si address;
				(if (i32.eq (local.get $s_val) (local.get $id)) (then
					(return (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $si) ))
				))

				;; const e_val = userIDs[ei];
				(local.set $e_val (i32.load (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $ei) )))
				;; if (e_val === id) return ei address;
				(if (i32.eq (local.get $e_val) (local.get $id)) (then
					(return (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $ei) ))
				))

				;; if      (id > e_val) mi = ei + 1;
				;; else if (id < s_val) mi = si;
				;; else             mi = ei;
				(if         (i32.gt_u (local.get $id) (local.get $e_val))
					(then (local.set $mi (i32.add (local.get $ei) (i32.const 1))))
					(else (if (i32.lt_u (local.get $id) (local.get $s_val))
						(then (local.set $mi (local.get $si)))
						(else (local.set $mi (local.get $ei)))
					))
				)
				(local.set $addr (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $mi) ))

				(br $while_break)
			))

			(br $while_loop)
		))

		;; grow the slice
		(call $memory/slice/push (local.get $ptr) (local.get $recordSize))

		;; shift data forwards to make room
		(memory.copy
			(i32.add (local.get $addr) (local.get $recordSize)) ;; dest
			(local.get $addr)                                   ;; src
			(i32.mul
				(i32.sub (local.get $length) (local.get $mi))
				(local.get $recordSize)
			)
		)
		;; blank out any existin data
		(memory.fill
			(local.get $addr)       ;; dest
			(i32.const 0)           ;; value(0)
			(local.get $recordSize) ;; size
		)

		(i32.store (local.get $addr) (local.get $id))

		(return (local.get $addr))
	)
)