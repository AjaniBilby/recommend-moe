(module $slice
	(import "malloc" "memory"   (memory 0))
	(import "malloc" "malloc"   (func $memory/malloc   (param i32    ) (result i32)))
	(import "malloc" "capacity" (func $memory/capacity (param i32    ) (result i32)))
	(import "malloc" "realloc"  (func $memory/realloc  (param i32 i32) (result i32)))

	(export "make"      (func $slice/make))
	(export "get"       (func $slice/get))
	(export "length"    (func $slice/length))
	(export "capacity"  (func $slice/capacity))
	(export "reserve"   (func $slice/reserve))
	(export "grow"      (func $slice/grow))
	(export "available" (func $slice/available))
	(export "transform" (func $slice/transform))
	(export "insert"    (func $slice/insert))
	(export "push"      (func $slice/push))

	;; MetaTag v128 {
	;;   0:     length: u32
	;;   4: recordSize: u32
	;;   8:        pad: u64
	;; }
	(global $HEADER_SIZE i32 (i32.const 16))


	(func $slice/make
		(param $recordSize i32)
		(param $reserve    i32)
		(result i32)

		(local $ptr i32)

		(local.set $ptr (call $memory/malloc
			(i32.add
				(global.get $HEADER_SIZE)
				(i32.mul (local.get $recordSize) (local.get $reserve))
			)
		))

		(i32.store offset=0 (local.get $ptr) (i32.const 0))
		(i32.store offset=4 (local.get $ptr) (local.get $recordSize))

		(return (local.get $ptr))
	)


	(func $slice/get
		(param $ptr   i32)
		(param $index i32)
		(result       i32)

		(return (i32.add
			(i32.add
				(local.get $ptr)
				(global.get $HEADER_SIZE)
			)
			(i32.mul
				(i32.load offset=4 (local.get $ptr)) ;; recordSize
				(local.get $index)
			)
		))
	)


	(func $slice/length
		(param $ptr   i32)
		(result       i32)
		(return (i32.load offset=0 (local.get $ptr))) ;; length
	)
	(func $slice/capacity
		(param $ptr      i32)
		(result          i32)
		(local $capacity i32)

		(local.set $capacity (call $memory/capacity (local.get $ptr)))

		(if (i32.lt_u (local.get $capacity) (global.get $HEADER_SIZE)) (then
			(return (i32.const 0))
		))

		(return (i32.div_u
			(i32.sub
				(local.get $capacity)
				(global.get $HEADER_SIZE)
			)
			(i32.load offset=4 (local.get $ptr)) ;; recordSize
		))
	)
	(func $slice/available
		(param $ptr   i32)
		(result       i32)

		(return (i32.sub
			(call $slice/capacity (local.get $ptr))
			(call $slice/length   (local.get $ptr))
		))
	)
	(func $slice/reserve
		(param $ptr      i32)
		(param $capacity i32)
		(result          i32)

		(return (call $memory/realloc
			(local.get $ptr)
			(i32.add
				(global.get $HEADER_SIZE)
				(i32.mul
					(i32.load offset=4 (local.get $ptr)) ;; recordSize
					(local.get $capacity)
				)
			)
		))
	)
	(func $slice/grow
		(param $ptr   i32)
		(param $slots i32)
		(result       i32)

		(return (call $slice/reserve
			(local.get $ptr)
			(i32.add
				(call $slice/capacity (local.get $ptr))
				(local.get $slots)
			)
		))
	)
	(func $slice/transform
		(param $ptr        i32)
		(param $length     i32)
		(param $recordSize i32)

		(i32.store offset=0 (local.get $ptr) (local.get $length))
		(i32.store offset=4 (local.get $ptr) (local.get $recordSize))
	)


	(func $slice/push
		(param $ptr    i32)
		(result        i32)
		(local $length i32)

		;; get ptr of new element
		(local.set $length (i32.load offset=0 (local.get $ptr)))

		;; increment length
		(i32.store offset=0 (local.get $ptr) (i32.add (local.get $length) (i32.const 1)))

		(return
			(call $slice/get (local.get $ptr) (local.get $length))
		)
	)

	(func $slice/insert
		(param $ptr        i32)
		(param $index      i32)
		(result            i32)
		(local $length     i32)
		(local $recordSize i32)

		(local.set $length (i32.load offset=0 (local.get $ptr)))

		;; if out-of-bounds then fallback to a push
		(if (i32.ge_u (local.get $index) (local.get $length)) (then
			(return (call $slice/push (local.get $ptr)))
		))

		(local.set $recordSize (i32.load offset=4 (local.get $ptr)))
		(i32.store offset=0 (local.get $ptr) (i32.add (local.get $length) (i32.const 1)))

		;; move pointer to element address
		(local.set $ptr (call $slice/get (local.get $ptr) (local.get $length)))

		;; move the elements after the index
		(memory.copy
			(i32.add (local.get $ptr) (local.get $recordSize)) ;; dest
			(local.get $ptr) ;; src
			(i32.mul
				(i32.sub (local.get $length) (local.get $index))
				(local.get $recordSize)
			)
		)

		;; blank the newly empty slot
		(memory.fill
			(local.get $ptr)
			(i32.const    0)
			(local.get $recordSize)
		)

		(return (local.get $ptr))
	)
)