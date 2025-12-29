(module $mf-factor
	(import "malloc" "memory"   (memory 0))
	(import "malloc" "malloc"   (func $memory/malloc   (param i32    ) (result i32)))
	(import "malloc" "capacity" (func $memory/capacity (param i32    ) (result i32)))
	(import "malloc" "realloc"  (func $memory/realloc  (param i32 i32) (result i32)))

	(import "slice" "make"      (func $slice/make      (param i32 i32    ) (result i32)))
	(import "slice" "get"       (func $slice/get       (param i32 i32    ) (result i32)))
	(import "slice" "length"    (func $slice/length    (param i32        ) (result i32)))
	(import "slice" "capacity"  (func $slice/capacity  (param i32        ) (result i32)))
	(import "slice" "grow"      (func $slice/grow      (param i32 i32    ) (result i32)))
	(import "slice" "reserve"   (func $slice/reserve   (param i32 i32    ) (result i32)))
	(import "slice" "available" (func $slice/available (param i32        ) (result i32)))
	(import "slice" "transform" (func $slice/transform (param i32 i32 i32) (result)))
	(import "slice" "push"      (func $slice/push      (param i32        ) (result i32)))
	(import "slice" "insert"    (func $slice/insert    (param i32 i32    ) (result i32)))

	(export "MakeContext" (func $make))
	(export "InsertScore" (func $insert))

	;; Context {
	;;   0: embeddingSize: Collection(u32)
	;;   4: medias:        Collection(u32)
	;;   8: mediaScores:   Collection(u32)
	;;  12: users:         Collection(u32)
	;;  16: userScores:    Collection(u32)
	;; }

	(func $make
		(param $embeddingSize i32)
		(result               i32)
		(local $ptr           i32)

		(local.set $ptr (call $memory/malloc (i32.const 0)))
		(i32.store offset=0 (local.get $ptr) (local.get $embeddingSize))

		;; use the mediaScores slice to put the raw (mediaID[u32], userID[u32], score[f32]) tuples in
		(i32.store offset=8 (local.get $ptr)
			(call $slice/make (i32.const 12) (i32.const 1000))
		)

		(return (local.get $ptr))
	)

	(func $insert
		(param $ctx     i32)
		(param $mediaID i32)
		(param $userID  i32)
		(param $score   f32)
		(local $ptr   i32)

		(local.set $ptr (i32.load offset=8 (local.get $ctx)))

		;; grow the slice if no available slots
		(if (i32.lt_u (call $slice/available (local.get $ptr)) (i32.const 1)) (then
			(local.set $ptr (call $slice/grow (local.get $ptr) (i32.const 10000)))
			(i32.store offset=8 (local.get $ctx) (local.get $ptr))
		))

		(local.set $ptr (call $slice/push (local.get $ptr)))
		(i32.store offset=0 (local.get $ptr) (local.get $mediaID))
		(i32.store offset=4 (local.get $ptr) (local.get $userID))
		(f32.store offset=8 (local.get $ptr) (local.get $score))
	)
)