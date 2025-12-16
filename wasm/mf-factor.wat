(module
	;; We import memory because we are operating on existing buffers
	(memory $0 1)
	(export "memory" (memory $0))

	;; uses little edian
	(data (i32.const  0) "\30\00\00\00") ;; mediaIndexHead
	(data (i32.const  4) "\00\00\00\00") ;; mediaScoreHead
	(data (i32.const  8) "\00\00\00\00") ;; userIndexHead
	(data (i32.const 12) "\00\00\00\00") ;; userScoreHead
	(data (i32.const 16) "\00\00\00\00") ;; embedding size
	(data (i32.const 20) "\30\00\00\00") ;; heaphead

	(global $mediaIndexHeadAddressPtr i32 (i32.const 0))
	(global $mediaScoreHeadAddressPtr i32 (i32.const 4))
	(global $userIndexHeadAddressPtr  i32 (i32.const 8))
	(global $userScoreHeadAddressPtr  i32 (i32.const 12))
	(global $embeddingSizePtr         i32 (i32.const 16))
	(global $heapHeadAddressPtr       i32 (i32.const 20))
	(global $memory/reserved i32)

	(export "Insert_EmbeddingSize" (func $set/embeddingSize))
	(func $set/embeddingSize
		(param $embeddingSize i32)
		(i32.store (global.get $embeddingSizePtr) (local.get $embeddingSize))
	)

	(export "Insert_MediaScore" (func $insert/mediaScore))
	(func $insert/mediaScore
		(param $mediaID i32)
		(param $userID  i32)
		(param $score   f32)

		(local $head i32)
		(local $tail i32)

		(local.set $head (i32.load (global.get $heapHeadAddressPtr)))
		(local.set $tail (i32.add (local.get $head) (i32.const 12) ))

		(call $memory/reserve (local.get $tail))

		(i32.store (global.get $heapHeadAddressPtr) (local.get $tail))

		(i32.store (local.get $head) (local.get $mediaID))
		(local.set $head (i32.add (local.get $head) (i32.const 4)))
		(i32.store (local.get $head) (local.get $userID))
		(local.set $head (i32.add (local.get $head) (i32.const 4)))
		(f32.store (local.get $head) (local.get $score))
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
