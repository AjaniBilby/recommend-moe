(module
	;; External Calling Convention
	;; Step 1: Set_EmbeddingSize
	;; Step 2: Insert_Score for every score
	;; Step 3: Index

	;; MemoryLayout = {
	;;   // using linear memory instead of globals for easier multithreading
	;;   // since you can have multiple modules access the same memory easily,
	;;   // but not globals
	;;   EMBEDDING_SIZE: int
	;;   mediaIndexHead: int
	;;   mediaScoreHead: int
	;;   userIndexHead:  int
	;;   userScoreHead:  int
	;;   heapHead:       int
	;;
	;;   mediaScore: {
	;;     // media
	;;     scores: {
	;;       userPtr: int,
	;;       score:   float
	;;     }[] (OrderBy: userID)
	;;   }[] (OrderBy: mediaID)
	;; 	 mediaCount: int
	;;   mediaIndex: {
	;;     mediaID:    int
	;;     scorePtr:   int // points to first mediaScore[]
	;;     scoreCount: int
	;;     embedding: byte[EMBEDDING_SIZE]
	;;     momentum:  byte[EMBEDDING_SIZE] // used by ADAM optimizer
	;;     velocity:  byte[EMBEDDING_SIZE]
	;;   }[] (OrderBy: mediaID)
	;;
	;;   userCount: int
	;;   userIndex: {
	;;     userID:     int
	;;     scorePtr:   int // points to first mediaScore[]
	;;     scoreCount: int
	;;     embedding: byte[EMBEDDING_SIZE]
	;;     // no optimizer used for user embeddings
	;;   }[] (OrderBy: mediaID)
	;;   userScore: {
	;;     // user
	;;     scores: {
	;;       mediaPtr: int,
	;;       score:    float
	;;     }[] (OrderBy: userID)
	;;   }[] (OrderBy: mediaID)
	;; }


	;; We import memory because we are operating on existing buffers
	(memory $0 1)
	(export "memory" (memory $0))

	;; uses little edian
	(data (i32.const  0) "\00\00\00\00") ;; EMBEDDING_SIZE: write once/read many
	(data (i32.const  4) "\00\00\00\00") ;; mediaIndexHead
	(data (i32.const  8) "\00\00\00\00") ;; mediaScoreHead
	(data (i32.const 12) "\00\00\00\00") ;; userIndexHead
	(data (i32.const 16) "\00\00\00\00") ;; userScoreHead
	(data (i32.const 20) "\00\00\00\00") ;; heapTail

	(global $ptr/embeddingSize         i32  (i32.const  0))
	(global $ptr/mediaIndexHeadAddress i32  (i32.const  4))
	(global $ptr/mediaScoreHeadAddress i32  (i32.const  8))
	(global $ptr/userIndexHeadAddress  i32  (i32.const 12))
	(global $ptr/userScoreHeadAddresss i32  (i32.const 16))
	(global $ptr/heapTailAddress       i32  (i32.const 20))
	(global $memory/heapHead           i32  (i32.const 24))
	(global $memory/reserved      (mut i32) (i32.const  0))



	(func $size/embedding
		(result i32)
		(i32.load align=4 (global.get $ptr/embeddingSize))
	)
	(func $size/media/score
		(result i32)
		(return (i32.const 8))
	)
	(func $size/media/index
		(result i32)
		(return (i32.add
			(i32.mul (i32.const 4) (i32.const 3))
			(i32.mul
				(call $size/embedding)
				(i32.const 3)
			)
		))
	)
	(func $size/user/score
		(result i32)
		(return (i32.const 8))
	)
	(func $size/user/index
		(result i32)
		(return (i32.add
			(i32.mul (i32.const 4) (i32.const 3))
			(call $size/embedding)
		))
	)



	(export "Set_EmbeddingSize" (func $embeddingSize/set))
	(func $embeddingSize/set
		(param $embeddingSize i32)
		(i32.store align=4 (global.get $ptr/embeddingSize) (local.get $embeddingSize))

		(i32.store align=4 (global.get $ptr/heapTailAddress)       (global.get $memory/heapHead) )
		(i32.store align=4 (global.get $ptr/mediaScoreHeadAddress) (global.get $memory/heapHead) )
	)

	(export "Insert_Score" (func $insert/mediaScore))
	(func $insert/mediaScore
		(param $mediaID i32)
		(param $userID  i32)
		(param $score   f32)

		(local $ptr i32)
		(local.set $ptr (call $memory/allocate (i32.mul
			(i32.const 4)
			(i32.const 3)
		)))

		(i32.store offset=0 align=4 (local.get $ptr) (local.get $mediaID))
		(i32.store offset=4 align=4 (local.get $ptr) (local.get $userID ))
		(f32.store offset=8 align=4 (local.get $ptr) (local.get $score  ))
	)

	(export "GetMediaID" (func $get/mediaID))
	(func $get/mediaID
		(param $index i32)
		(result i32)
		(local $ptr i32)

		(return (i32.load (i32.add
			(i32.add
				(i32.const 8)
				(i32.load (global.get $ptr/mediaIndexHeadAddress))
			)
			(i32.mul (local.get $index) (call $size/media/index))
		)))

		(local.set $ptr (i32.add
			(global.get $ptr/mediaIndexHeadAddress)
			(i32.add
				(i32.const 4)
				(i32.mul
					(local.get $index)
					(call $size/media/index)
				)
			)
		))

		(return (local.get $ptr))
	)

	(export "Index" (func $run/index))
	(func $run/index
		(local $scrub i32)
		(call $index/media)
		;; (call $index/user)
		;;
		(i32.store (call $memory/allocate (i32.const 4)) (i32.const -1))
	)


	(func $index/media
		(local $cursor/read      i32)
		(local $cursor/write     i32)
		(local $index/head       i32)
		(local $size/index i32)

		(local $media/ptr    i32)
		(local $media/id     i32)
		(local $media/scores i32)

		(local $curr/mediaID i32)
		(local $curr/userID  i32)
		(local $curr/score   i32)
		(local $medias       i32)

		;; set the score head
		(local.set $index/head (call $memory/allocate (i32.const 8)))
		(i32.store align=4 (global.get $ptr/mediaIndexHeadAddress) (local.get $index/head) )

		;; pre-compute index record size
		(local.set $size/index (call $size/media/index))

		(local.set $cursor/write (i32.load align=4 (global.get $ptr/mediaScoreHeadAddress)))
		(local.set $cursor/read  (local.get $cursor/write))

		;; pre-init first media
		(local.set $media/ptr    (call $memory/allocate (local.get $size/index)))
		(local.set $media/id     (i32.load (local.get $cursor/read)))
		(local.set $media/scores (i32.const 1))
		(local.set $medias       (i32.const 1))

		(i32.store offset=0 align=4 (local.get $media/ptr) (local.get $media/id))
		(i32.store offset=4 align=4 (local.get $media/ptr) (local.get $cursor/write))

		;; for (; cusor/read < index/head; cusor/read += $size/index)
		(block $while_break (loop $while_loop
			(br_if $while_break (i32.ge_u (local.get $cursor/read) (local.get $index/head)))

			;; read original score format
			(local.set $curr/mediaID (i32.load offset=0 align=4 (local.get $cursor/read)))
			(local.set $curr/userID  (i32.load offset=4 align=4 (local.get $cursor/read)))
			(local.set $curr/score   (i32.load offset=8 align=4 (local.get $cursor/read)))

			;; DEBUG: clear
			(i32.store offset=0 align=4 (local.get $cursor/read) (i32.const 0))
			(i32.store offset=4 align=4 (local.get $cursor/read) (i32.const 0))
			(i32.store offset=8 align=4 (local.get $cursor/read) (i32.const 0))

			;; write to proper format
			(i32.store offset=0 align=4 (local.get $cursor/write) (local.get $curr/userID))
			(i32.store offset=4 align=4 (local.get $cursor/write) (local.get $curr/score))

			(if (i32.ne (local.get $media/id) (local.get $curr/mediaID)) (then
				;; write completed score count to previous media
				(i32.store offset=8 align=4 (local.get $media/ptr) (local.get $media/scores))

				(local.set $media/ptr    (call $memory/allocate (local.get $size/index)))
				(local.set $media/id     (local.get $curr/mediaID))
				(local.set $media/scores (i32.const 1))
				(local.set $medias       (i32.add (local.get $medias) (i32.const 1)))

				;; fill in ID field
				(i32.store offset=0 align=4 (local.get $media/ptr) (local.get $media/id))
				(i32.store offset=4 align=4 (local.get $media/ptr) (local.get $cursor/write))
			))

			;; progress cursors
			(local.set $cursor/read  (i32.add (local.get $cursor/read ) (i32.const 12)))
			(local.set $cursor/write (i32.add (local.get $cursor/write) (i32.const 8)))

			(br $while_loop)
		))


		;; save final values
		(i32.store offset=8 align=4 (local.get $media/ptr)  (local.get $media/scores))
		(i32.store offset=0 align=4 (local.get $index/head) (local.get $medias))

		;; shift media backwards to fill gap
		(memory.copy
			(local.get $cursor/write) ;; dest
			(local.get $index/head)   ;; src
			(i32.sub
				(i32.load (global.get $ptr/heapTailAddress))
				(local.get $index/head)
			)
		)
		(i32.store align=4 (global.get $ptr/mediaIndexHeadAddress) (local.get $cursor/write) )

		;; clear the old data
		(local.set $media/ptr (i32.add
			(local.get $cursor/write)
			(i32.sub
				(i32.load (global.get $ptr/heapTailAddress))
				(local.get $index/head)
			)
		))
		(memory.fill
			(local.get $media/ptr)
			(i32.const 0) ;; value
			(i32.sub (local.get $index/head) (local.get $cursor/write)) ;; size
		)

		(i32.store (global.get $ptr/heapTailAddress) (local.get $media/ptr))
	)

	(func $index/user
		(local $head   i32)
		(local $cursor i32)
		(local $limit  i32)
	)

	(func $memory/insertSorted
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
			(return (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) ))
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
			(local.set $curr (i32.load align=4 (local.get $addr)))

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
				(local.set $s_val (i32.load align=4 (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $si) )))
				;; if (s_val === id) return si address;
				(if (i32.eq (local.get $s_val) (local.get $id)) (then
					(return (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $si) ))
				))

				;; const e_val = userIDs[ei];
				(local.set $e_val (i32.load align=4 (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $ei) )))
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

		(i32.store align=4 (local.get $addr) (local.get $id))

		(return (local.get $addr))
	)



	;; Slice { length: int, element[] }
	(func $memory/slice/elementAddress
		(param $ptr        i32)
		(param $recordSize i32)
		(param $index      i32)
		(result i32)

		(return (i32.add
			(i32.add (local.get $ptr  ) (i32.const 4)) ;; add the slice length offset
			(i32.mul (local.get $index) (local.get $recordSize) )
		))
	)

	(func $memory/slice/length
		(param $ptr i32)
		(result i32)

		(return (i32.load align=4 (local.get $ptr)))
	)

	;; ensure linear memory is big enough
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
		(i32.store align=4 (local.get $ptr (local.get $length)))
		(call $memory/reserve (call $memory/slice/elementAddress (local.get $ptr) (local.get $recordSize) (local.get $length) ))

		(return (local.get $addr))
	)

	(func $memory/allocate
		(param $bytes i32)
		(result i32)

		(local $head i32)
		(local $tail i32)

		(local.set $head (i32.load align=4 (global.get $ptr/heapTailAddress)))

		;; update heap pointer
		(local.set $tail (i32.add
			(local.get $head )
			(local.get $bytes)
		))
		(i32.store align=4 (global.get $ptr/heapTailAddress) (local.get $tail))

		;; ensure linear memory is large enough
		(call $memory/reserve (local.get $tail))

		(return (local.get $head))
	)

	(func $memory/reserve ;; must never grow more than 64kb at a time
		(param $bytes i32)

		;; check known memory size is safe (memory can't shrink)
		(if (i32.gt_u (global.get $memory/reserved) (local.get $bytes))
			(then return)
		)

		;; recalculate the current reserved size from pages (may have chaned from another thread)
		(global.set $memory/reserved (i32.mul (memory.size) (i32.const 65536)))

		;; no need to grow
		(if (i32.gt_u (global.get $memory/reserved) (local.get $bytes))
			(then return)
		)

		(drop (memory.grow (i32.const 1)))

		(global.set $memory/reserved (i32.add (global.get $memory/reserved) (i32.const 65536)))
	)
)
