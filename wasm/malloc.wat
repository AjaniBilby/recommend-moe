(module $malloc
	;; MetaTag v128 {
	;;   0:  size: u32 (number of bytes from start)
	;;   4:   pad: u32 (space for 64bit encoding)
	;;   8:  prev: u32
	;;  12:   pad: u24
	;;  15:  used:  i8
	;; }
	(global $TAG_SIZE i32 (i32.const 16))
	(memory $0 1)

	(export "memory"    (memory $0))
	(export "malloc"    (func $memory/allocate  ))
	(export "free"      (func $memory/free      ))
	(export "realloc"   (func $memory/realloc   ))
	(export "capacity"  (func $memory/capacity  ))
	(export "stripe"    (func $debug/stripe     ))
	(export "blockSize" (func $memory/blockSize ))

	;; just for debugging to see what regions are allocated
	(func $debug/stripe
		(param $ptr i32)
		(param $val i32)

		(memory.fill
			(local.get $ptr) ;; dest
			(local.get $val) ;; value(ab)
			(i32.sub
				(i32.load offset=0
					(i32.sub
						(local.get  $ptr)
						(global.get $TAG_SIZE)
					)
				)
				(global.get $TAG_SIZE)
			)
		)
	)

	(func $memory/blockSize
		(param $bytes i32)
		(result i32)

		(return (i32.add
			(i32.and ;; align to 64bit
				(i32.add (local.get $bytes) (i32.const 15))
				(i32.const -16)
			)
			(global.get $TAG_SIZE)
		))
	)

	(func $memory/capacity
		(param $address  i32)
		(result i32)

		(return (i32.load offset=0 (i32.sub
			(local.get  $address)
			(global.get $TAG_SIZE)
		)))
	)

	(func $memory/allocate
		(param $bytes i32)
		(result       i32)

		(local $ptr        i32)
		(local $next       i32)
		(local $block_size i32)
		(local $split_size i32)

		(local.set $bytes      (call $memory/blockSize (local.get $bytes)))
		(local.set $split_size (i32.add (local.get $bytes) (global.get $TAG_SIZE)))
		(local.set $ptr (i32.const 0))

		(block $while_break (loop $while_loop
			(local.set $block_size (i32.load offset=0 (local.get $ptr)))

			;; skip over used block
			(if (i32.ne (i32.load8_u offset=15 (local.get $ptr)) (i32.const 0)) (then
				(local.set $ptr (i32.add (local.get $ptr) (local.get $block_size)))
				(br $while_loop)
			))

			;; consume perfectly sized block
			(if (i32.eq (local.get $block_size) (local.get $bytes)) (then
				(i32.store8 offset=15 (local.get $ptr) (i32.const 1)) ;; mark used
				(return (i32.add
					(local.get $ptr)
					(global.get $TAG_SIZE)
				))
			))

			;; split unused block
			(if (i32.lt_u (local.get $split_size) (local.get $block_size)) (then
				(i32.store  offset=0  (local.get $ptr) (local.get $bytes)) ;; shrink region size
				(i32.store8 offset=15 (local.get $ptr) (i32.const 1))      ;; mark used

				;; create new header
				(local.set $next (i32.add
					(local.get $ptr)
					(local.get $bytes)
				))
				(local.set $block_size (i32.sub
					(local.get $block_size)
					(local.get $bytes)
				))
				(i32.store  offset=0  (local.get $next) (local.get $block_size))
				(i32.store  offset=8  (local.get $next) (local.get $ptr))
				(i32.store8 offset=15 (local.get $next) (i32.const 0)) ;; mark unused

				;; update next block's prev pointer
				(i32.store  offset=8
					(i32.add (local.get $next) (local.get $block_size))
					(local.get $next)
				)

				(return (i32.add
					(local.get $ptr)
					(global.get $TAG_SIZE)
				))
			))

			;; create new end region
			(if (i32.eq (local.get $block_size) (i32.const 0)) (then
				(i32.store  offset=0  (local.get $ptr) (local.get $bytes))
				(i32.store8 offset=15 (local.get $ptr) (i32.const 1))  ;; mark used

				(local.set $next (i32.add
					(local.get  $ptr )
					(local.get  $bytes  )
				))
				(call $memory/reserve (local.get $next))

				;; new header
				(i32.store  offset=0  (local.get $next) (i32.const 0))
				(i32.store  offset=8  (local.get $next) (local.get $ptr))
				(i32.store8 offset=15 (local.get $next) (i32.const 0))

				(return (i32.add
					(local.get  $ptr  )
					(global.get $TAG_SIZE)
				))
			))

			;; try next
			(local.set $ptr (i32.add (local.get $ptr) (local.get $block_size)))
			(br $while_loop)
		))

		(unreachable)
	)

	(func $memory/free
		(param $ptr        i32)
		(local $block_size i32)
		(local $other      i32)

		;; null pointer
		(if (i32.lt_u (local.get $ptr) (global.get $TAG_SIZE)) (then (return) ))

		(local.set $ptr (i32.sub
			(local.get  $ptr)
			(global.get $TAG_SIZE)
		))

		;; already freed
		(if (i32.eq (i32.load8_u offset=15 (local.get $ptr)) (i32.const 0)) (then
			(return)
		))

		(local.set $block_size (i32.load offset=0 (local.get $ptr)))

		;; ignore invalid block
		(if (i32.le_u (local.get $block_size) (global.get $TAG_SIZE)) (then
			(return)
		))

		;; attempt merge with previous block (LHS)
		(local.set $other (i32.load offset=8 (local.get $ptr)))
		(if (i32.eq (i32.load8_u offset=15 (local.get $other)) (i32.const 0))
			(then
				;; current chunk (MID)
				(memory.fill
					(local.get $ptr) ;; dest
					(i32.const 0)    ;; value(0)
					(local.get $block_size)
				)

				;; merge with previous (LHS)
				(local.set $ptr (local.get $other))
				(local.set $block_size (i32.add
					(local.get $block_size)
					(i32.load offset=0 (local.get $other))
				))
				(i32.store offset=0 (local.get $other) (local.get $block_size))
			)
			(else
				(i32.store8 offset=15 (local.get $ptr) (i32.const 0)) ;; mark-free
				(memory.fill ;; clear just data-segment
					(i32.add   ;; dest
						(local.get  $ptr)
						(global.get $TAG_SIZE)
					)
					(i32.const 0) ;; value(0)
					(i32.sub (local.get $block_size) (global.get $TAG_SIZE))
				)
			)
		)


		;; attempt merge with next block (RHS)
		(local.set $other (i32.add (local.get $ptr) (local.get $block_size) ))

		;; should not merge with next block: used
		(if (i32.ne (i32.load8_u offset=15 (local.get $other)) (i32.const 0)) (then
			(return)
		))

		;; if next chunk is tail
		(if (i32.eq (i32.load offset=0 (local.get $other)) (i32.const 0)) (then
			;; move tail block backwards
			(i32.store offset=0 (local.get $ptr) (i32.const 0))

			;; clear previous tail
			(v128.store (local.get $other) (v128.const i32x4 0 0 0 0))
			(return)
		))

		;; increase block size
		(i32.store offset=0 (local.get $ptr)
			(i32.add
				(local.get $block_size)
				(i32.load offset=0 (local.get $other))
			)
		)

		;; clear next header (RHS)
		(v128.store (local.get $other) (v128.const i32x4 0 0 0 0))
	)

	(func $memory/realloc
		(param $address  i32)
		(param $bytes    i32)
		(result i32)

		(local $ptr             i32)
		(local $block_size      i32)
		(local $next/ptr        i32)
		(local $next/block_size i32)

		(local.set $ptr (i32.sub
			(local.get  $address)
			(global.get $TAG_SIZE)
		))
		(local.set $bytes (call $memory/blockSize (local.get $bytes)))

		;; does it already fit?
		(local.set $block_size (i32.load offset=0 (local.get $ptr)))
		(if (i32.le_u (local.get $bytes) (local.get $block_size)) (then
			(return (local.get $address))
		))

		(local.set $next/ptr        (i32.add (local.get $ptr) (local.get $block_size)))
		(local.set $next/block_size (i32.load offset=0        (local.get $next/ptr)))

		;; cannot merge into next
		(if (i32.or
			(i32.ne (i32.const 0) (i32.load8_u offset=15 (local.get $next/ptr)))      ;; used
			(i32.lt_u
				(i32.add (local.get $block_size) (local.get $next/block_size))          ;; not enough space
				(local.get $bytes)
			)
		) (then
			;; restore size back
			(local.set $bytes (i32.sub (local.get $next/block_size) (local.get $block_size)))

			;; create new block
			(local.set $next/ptr (call $memory/allocate (local.get $bytes)))

			;; move data
			(memory.copy
				(local.get $next/ptr) ;; dest
				(i32.add              ;; src
					(local.get  $ptr     )
					(global.get $TAG_SIZE)
				)
				(local.get $bytes)
			)

			;; clear old block
			(call $memory/free (local.get $address))

			(return (local.get $next/ptr))
		))

		;; clear next header
		(v128.store (local.get $next/ptr) (v128.const i32x4 0 0 0 0))

		;; calculate remainder block size
		(local.set $next/block_size (i32.sub
			(i32.add (local.get $block_size) (local.get $next/block_size))
			(local.get $bytes)
		))

		;; is the remaining space too small for a new header?
		(if (i32.le_u
			(local.get $next/block_size)
			(i32.add (global.get $TAG_SIZE) (global.get $TAG_SIZE)) ;; header + body(sized TAG)
		) (then
			;; expand to consume the entire block
			(local.set $bytes (i32.add
				(local.get $bytes)
				(local.get $next/block_size)
			))

			;; store new size
			(i32.store offset=0 (local.get $ptr) (local.get $bytes))

			;; update next block's prev block pointer
			(i32.store  offset=8
				(i32.add (local.get $ptr) (local.get $bytes))
				(local.get $ptr)
			)
		) (else
			;; store new size
			(i32.store offset=0 (local.get $ptr) (local.get $bytes))

			;; make new header
			(local.set $next/ptr  (i32.add (local.get $ptr) (local.get $bytes) ))
			(i32.store  offset=0  (local.get $next/ptr) (local.get $next/block_size))
			(i32.store  offset=8  (local.get $next/ptr) (local.get $ptr))
			(i32.store8 offset=15 (local.get $next/ptr) (i32.const 0))

			;; update next next block's prev block pointer
			(i32.store offset=8
				(i32.add (local.get $next/ptr) (local.get $next/block_size))
				(local.get $next/ptr)
			)
		))

		(return (local.get $address))
	)

	;; grow the linear memory if necessary
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

		(if (i32.le_u (local.get $pages/delta) (i32.const 0))
			(then return)
		)

		(drop (memory.grow (local.get $pages/delta)))
	)
)
