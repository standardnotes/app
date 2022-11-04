import {
  CompoundPredicate,
  DecryptedItem,
  IncludesPredicate,
  NotPredicate,
  Predicate,
  PredicateInterface,
} from '@standardnotes/snjs'

type Props = {
  predicate: PredicateInterface<DecryptedItem>
}

const SmartViewPredicate = ({ predicate }: Props) => {
  if (predicate instanceof CompoundPredicate) {
    return (
      <>
        {predicate.predicates.map((subPredicate, index, array) => {
          return index !== array.length - 1 ? (
            <>
              <SmartViewPredicate key={index} predicate={subPredicate} />
              {predicate.operator}
            </>
          ) : (
            <SmartViewPredicate key={index} predicate={subPredicate} />
          )
        })}
      </>
    )
  } else if (predicate instanceof IncludesPredicate) {
    return (
      <div>
        <div>{predicate.toJson().keypath}</div>
        <div>includes</div>
        <SmartViewPredicate predicate={predicate.predicate} />
      </div>
    )
  } else if (predicate instanceof NotPredicate) {
    return (
      <div>
        <div>NOT</div>
        <SmartViewPredicate predicate={predicate.predicate} />
      </div>
    )
  } else if (predicate instanceof Predicate) {
    return (
      <div className="flex items-center gap-2">
        <span>{predicate.keypath}</span>
        <span>{predicate.operator}</span>
        <span>
          {predicate.targetValue instanceof Date
            ? predicate.targetValue.toLocaleString()
            : predicate.targetValue.toString()}
        </span>
      </div>
    )
  }

  return null
}

export default SmartViewPredicate
