(module
	;; We import memory because we are operating on existing buffers
	(import "env" "memory" (memory 0))

	(export "__internal_test_v128_f32x4_sum" (func $f32x4/sumTest))
	(func $f32x4/sumTest
		(param $ptr i32)
		(result f32)

		(return_call $f32x4/sum (v128.load (local.get $ptr)))
	)

	(func $f32x4/sum
		(param $val v128)
		(result     f32 )

		;; Fold Upper half (Lanes 2,3) onto Lower half (Lanes 0,1)
		;; Input:  [ A, B, C, D ]
		;; Target: [ A+C, B+D, ... ]
		(local.set $val
				(f32x4.add
						(local.get $val)
						;; Shuffle moves Lanes 2,3 -> 0,1
						;; Bytes 8-15 represent the upper two floats
						(i8x16.shuffle
								8 9 10 11   12 13 14 15   0 1 2 3   4 5 6 7
								(local.get $val) (local.get $val)
						)
				)
		)

		;; Fold Odd lane (Lane 1) onto Even lane (Lane 0)
		;; Input:  [ A+C, B+D, ... ]
		;; Target: [ (A+C)+(B+D), ... ] which is A+B+C+D
		(local.set $val
				(f32x4.add
						(local.get $val)
						;; Shuffle moves Lane 1 -> 0
						;; Bytes 4-7 represent the second float
						(i8x16.shuffle
								4 5 6 7   0 1 2 3   8 9 10 11   12 13 14 15
								(local.get $val) (local.get $val)
						)
				)
		)

		;; The total sum is now sitting in Lane 0
		(f32x4.extract_lane 0 (local.get $val))
	)

	(export "VectorLength" (func $vector/length))
	(func $vector/length
		(param $ptr i32) ;; Pointer to vector
		(param $len i32) ;; Length of the vectors (e.g. 386)
		(result f32)

		;; --- Local Variables ---
		(local $acc_vec         v128) ;; The SIMD accumulator
		(local $acc             f32 ) ;;
		(local $temp_vec        v128) ;;
		(local $temp            f32 ) ;;
		(local $i               i32 ) ;; Current index (element count)

		;; Initialize
		(local.set $acc_vec (v128.const f32x4 0.0 0.0 0.0 0.0))
		(local.set $i       ( i32.const       0              ))

		;; Main SIMD loop
		(block $simd_break (loop $simd_loop
			(br_if $simd_break
				(i32.gt_u
					(i32.add (local.get $i) (i32.const 4))
					(local.get $len)
				)
			)

			;; load temp chunks
			(local.set $temp_vec (v128.load
				(i32.add
					(local.get $ptr)
					(i32.shl (local.get $i) (i32.const 2))
				)
			))

			;; sum += a * a
			(local.set $acc_vec (f32x4.add
				(f32x4.mul (local.get $temp_vec) (local.get $temp_vec))
				(local.get $acc_vec)
			))

			;; i += 4
			(local.set $i (i32.add (local.get $i) (i32.const 4)) )

			;; continue
			(br $simd_loop)
		))

		;; Collapse SIMD accumulator
		(local.set $acc (call $f32x4/sum (local.get $acc_vec)))

		;; Remainders
		(block $remainder_break (loop $remainder_loop
			;; if ( i >= len ) break;
			(br_if $remainder_break
				(i32.ge_u (local.get $i) (local.get $len))
			)

			;; load temp chunks
			(local.set $temp (f32.load
				(i32.add
					(local.get $ptr)
					(i32.shl (local.get $i) (i32.const 2))
				)
			))

			;; sum += a * a
			(local.set $acc (f32.add
				(f32.mul (local.get $temp) (local.get $temp))
				(local.get $acc)
			))

			;; i ++
			(local.set $i (i32.add (local.get $i) (i32.const 1)) )

			;; continue
			(br $remainder_loop)
		))

		(if (f32.eq (local.get $acc) (f32.const 1.0))
			(then (return (f32.const 0.0)))
		)

		(return (f32.sqrt (local.get $acc)))
	)

	(export "VectorScale" (func $vector/scale))
	(func $vector/scale
		(param $ptr    i32) ;; Pointer to vector
		(param $len    i32) ;; Length of the vectors (e.g. 386)
		(param $scalar f32) ;; scale the vector by a certain amount
		(result)

		(local $scalar_vec      v128)
		(local $address         i32 )
		(local $i               i32 )

		;; remnoved not really worth it, very unlikely - wastes cycles
		;; shortcut: no-op
		;; (if (f32.eq (local.get $scalar) (f32.const 1.0))
		;; 	(then (return))
		;; )

		;; Vector Chunks
		(local.set $i (i32.const 0 ))
		(local.set $scalar_vec (f32x4.splat (local.get $scalar)))
		(block $simd_break (loop $simd_loop
			(br_if $simd_break
				(i32.gt_u
					(i32.add (local.get $i) (i32.const 4))
					(local.get $len)
				)
			)

			;; load temp chunks
			(local.set $address (i32.add
				(local.get $ptr)
				(i32.shl (local.get $i) (i32.const 2))
			))
			(v128.store
				(local.get $address)
				(f32x4.mul
					(v128.load (local.get $address))
					(local.get $scalar_vec)
				)
			)

			;; i += 4
			(local.set $i (i32.add (local.get $i) (i32.const 4)) )

			;; continue
			(br $simd_loop)
		))

		;; Remainder elements
		(block $remainder_break (loop $remainder_loop
			;; if ( i >= len ) break;
			(br_if $remainder_break
				(i32.ge_u (local.get $i) (local.get $len))
			)

			;; load temp chunks
			(local.set $address (i32.add
				(local.get $ptr)
				(i32.shl (local.get $i) (i32.const 2))
			))
			(f32.store
				(local.get $address)
				(f32.mul
					(f32.load (local.get $address))
					(local.get $scalar)
				)
			)

			;; i ++
			(local.set $i (i32.add (local.get $i) (i32.const 1)) )

			;; continue
			(br $remainder_loop)
		))

		(return)
	)

	(export "VectorNormalize" (func $vector/normalize))
	(func $vector/normalize
		(param $ptr i32) ;; Pointer to vector
		(param $len i32) ;; Length of the vectors (e.g. 386)
		(result)

		(local $length f32)

		(local.set $length
			(call $vector/length (local.get $ptr) (local.get $len))
		)

		;; Safety: If length is too small, do nothing to avoid Infinity/NaN
		(if (f32.lt (local.get $length) (f32.const 0.00001))
			(then (return))
		)

		;; length = 1 / length // inverse length
		(local.set $length (f32.div
			(f32.const 1.0)
			(local.get $length)
		))

		(return_call $vector/scale (local.get $ptr) (local.get $len) (local.get $length))
	)

	(export "VectorDot" (func $vector/dot))
	(func $vector/dot
		(param $ptr_a i32) ;; Pointer to vector A
		(param $ptr_b i32) ;; Pointer to vector B
		(param $len   i32) ;; Length of the vectors (e.g. 386)
		(result       f32) ;; Returns the dot product

		(local $vec_temp_a v128)
		(local $vec_temp_b v128)
		(local $temp_a     f32 )
		(local $temp_b     f32 )
		(local $acc_vec    v128)
		(local $acc        f32 )
		(local $i          i32 )

		;; Initialize
		(local.set $acc_vec (v128.const f32x4 0.0 0.0 0.0 0.0))

		;; Vector Chunks
		(local.set $i (i32.const 0))
		(block $simd_break (loop $simd_loop
			(br_if $simd_break
				(i32.gt_u
					(i32.add (local.get $i) (i32.const 4))
					(local.get $len)
				)
			)

			;; load temp chunks
			(local.set $vec_temp_a (v128.load (i32.add
				(local.get $ptr_a)
				(i32.shl (local.get $i) (i32.const 2))
			) ))
			(local.set $vec_temp_b (v128.load (i32.add
				(local.get $ptr_b)
				(i32.shl (local.get $i) (i32.const 2))
			) ))

			;; product += a * b
			(local.set $acc_vec (f32x4.add
				(f32x4.mul (local.get $vec_temp_a) (local.get $vec_temp_b))
				(local.get $acc_vec)
			))

			;; i += 4
			(local.set $i (i32.add (local.get $i) (i32.const 4)) )

			;; continue
			(br $simd_loop)
		))

		;; Collapse SIMD accumulators
		(local.set $acc (call $f32x4/sum (local.get $acc_vec)))

		;; Remainder elements
		(block $remainder_break (loop $remainder_loop
			;; if ( i >= len ) break;
			(br_if $remainder_break
				(i32.ge_u (local.get $i) (local.get $len))
			)

			;; load temp chunks
			(local.set $temp_a (f32.load (i32.add
				(local.get $ptr_a)
				(i32.shl (local.get $i) (i32.const 2))
			) ))
			(local.set $temp_b (f32.load (i32.add
				(local.get $ptr_b)
				(i32.shl (local.get $i) (i32.const 2))
			) ))

			;; product += a * b
			(local.set $acc (f32.add
				(f32.mul (local.get $temp_a) (local.get $temp_b))
				(local.get $acc)
			))

			;; i ++
			(local.set $i (i32.add (local.get $i) (i32.const 1)) )

			;; continue
			(br $remainder_loop)
		))

		(return (local.get $acc))
	)
)
